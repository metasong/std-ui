import type { RouteDef, RouteLocation } from '../types.js';
import type { LeaveHooks } from './leave-hooks.js';
import { loadMatches } from './loader.js';
import { planNavigation, type GoPlan, type Plan } from './plan.js';
import type { RouteTable } from './route-table.js';
import type { RouterState } from './state.js';
import { Transaction } from './transaction.js';
import type { Announcer } from './announcer.js';
import { withViewTransition, type ViewTransitionHooks } from './view-transition.js';

/** Optional, non-essential effects around Commit. */
export interface Presentation {
	viewTransition?: boolean | ViewTransitionHooks;
	announcer?: Announcer;
}

/**
 * Plan → Load → Commit, plus the "current transaction" rule: starting one supersedes the previous.
 * Knows nothing about the browser; entry points (see router.ts) feed it locations.
 */
export class Pipeline {
	#tx: Transaction | null = null;
	#committed = false;
	readonly #vtHooks = new Set<ViewTransitionHooks>();

	constructor(
		private readonly table: RouteTable,
		private readonly leave: LeaveHooks,
		private readonly state: RouterState,
		private readonly present: Presentation = {},
	) {}

	begin(browserSignal?: AbortSignal): Transaction {
		this.#tx?.abort();
		return (this.#tx = new Transaction(browserSignal));
	}

	abort(): void {
		this.#tx?.abort();
	}

	/** Registers hooks for view transitions (e.g. an outlet scoping its `view-transition-name`); returns an unregister function. */
	addViewTransitionHooks(hooks: ViewTransitionHooks): () => void {
		this.#vtHooks.add(hooks);
		return () => void this.#vtHooks.delete(hooks);
	}

	/** The `viewTransition` option's hooks plus every registered one, as a single set of hooks. */
	#hooks(): ViewTransitionHooks {
		const option = this.present.viewTransition;
		const all = [...(typeof option === 'object' ? [option] : []), ...this.#vtHooks];
		return {
			onStart: () => all.forEach((h) => h.onStart?.()),
			onFinish: () => all.forEach((h) => h.onFinish?.()),
		};
	}

	/** Plan: may this navigation happen, and where does it end? */
	plan(to: RouteLocation, leaving: boolean, tx: Transaction): Promise<Plan | null> {
		return planNavigation({
			routes: this.table.all,
			leave: this.leave,
			from: this.state.location.peek(),
			to,
			leaving,
			signal: tx.signal,
			isStale: () => tx.stale,
		});
	}

	/** Load, then Commit. A superseded transaction never commits. */
	async load(plan: GoPlan, tx: Transaction): Promise<void> {
		this.state.loading();
		let results: ReadonlyMap<RouteDef, unknown> = new Map();
		let error = plan.error; // Plan failed: skip loading, commit the error
		if (error === undefined) {
			try {
				results = await loadMatches(plan.matches, plan.to, tx.signal);
			} catch (err) {
				error = err;
			}
		}
		if (tx.stale) return;
		const commit = (): void => this.state.commit(plan, results, error);
		const first = !this.#committed;
		this.#committed = true;
		if (this.present.viewTransition && !first) await withViewTransition(commit, this.#hooks());
		else commit();
		// The initial load is not a navigation the user needs told about.
		if (!first && !tx.stale) this.present.announcer?.announce({ location: plan.to, matches: plan.matches });
	}

	/** A navigation that ends without committing (blocked). Only the latest transaction may settle. */
	settle(tx: Transaction): void {
		if (this.#tx === tx) this.state.settle();
	}
}
