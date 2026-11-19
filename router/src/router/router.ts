import { computed, signal, type Computed, type Signal } from '@std-ui/core';
import { withPrecommit } from '../shim/precommit-shim.js';
import type { NavigateEventLike, NavigationLike } from '../navigation/types.js';
import type {
	BeforeLeaveHook,
	BeforeLeaveOptions,
	NavigateOptions,
	RouteDef,
	RouteLocation,
	RouteMatch,
	RouterStatus,
} from '../types.js';
import { warnNotFound } from '../dev/warn.js';
import { abortError, swallowAbort } from './abort.js';
import { BasePath } from './base-path.js';
import { LeaveHooks } from './leave-hooks.js';
import { loadMatches } from './loader.js';
import { isRedirect, planNavigation, REDIRECT_INFO, type Plan } from './plan.js';
import { RouteTable } from './route-table.js';
import { Transaction } from './transaction.js';

export interface RouterOptions {
	routes?: RouteDef[];
	/** Path prefix the app is mounted under, e.g. `/app`. */
	base?: string;
	/** Defaults to `window.navigation`; throws if absent. */
	navigation?: NavigationLike;
}

type GoPlan = Extract<Plan, { kind: 'go' }>;

/**
 * Every navigation is a transaction: Plan (may it happen, and where does it end?) → Load (lazy,
 * load) → Commit (publish to the signals). This class owns the state and the entry points
 * (browser `navigate` event, `start`, route changes); each entry point just runs those steps.
 */
export class Router {
	readonly location: Signal<RouteLocation>;
	readonly matches: Signal<RouteMatch[]> = signal<RouteMatch[]>([]);
	readonly status: Signal<RouterStatus> = signal<RouterStatus>('idle');
	readonly error: Signal<unknown> = signal<unknown>(undefined);
	/** `load()` results keyed by route. */
	readonly data: Signal<ReadonlyMap<RouteDef, unknown>> = signal<ReadonlyMap<RouteDef, unknown>>(new Map());
	readonly params: Computed<Record<string, string>>;

	readonly #nav: NavigationLike;
	readonly #base: BasePath;
	readonly #table: RouteTable;
	readonly #leave = new LeaveHooks();
	#started = false;
	#stopListening: (() => void) | null = null;
	#tx: Transaction | null = null;
	#invalidateQueued = false;

	constructor(options: RouterOptions = {}) {
		const nav = options.navigation ?? (globalThis as { navigation?: NavigationLike }).navigation;
		if (!nav) throw new Error('@std-ui/router requires the Navigation API (window.navigation).');
		this.#nav = withPrecommit(nav);
		this.#base = new BasePath(options.base);
		this.#table = new RouteTable(options.routes ?? [], () => this.#invalidate());
		this.location = signal(this.#readLocation());
		this.params = computed(() => this.matches().at(-1)?.params ?? {});
	}

	// ---- public API ----

	get routes(): RouteDef[] {
		return this.#table.all;
	}

	/** Registers a route (markup routes pass their parent's def). Returns an unregister function. */
	addRoute(def: RouteDef, parent?: RouteDef): () => void {
		return this.#table.add(def, parent);
	}

	/**
	 * Runs before every router-handled navigation; return `false` to block it. Use it to guard
	 * unsaved work, e.g. `router.beforeLeave(() => !form.changes.dirty() || confirm('Discard changes?'))`.
	 * Pass `{ unload }` to also prompt on tab close / reload. Returns an unregister function.
	 */
	beforeLeave(hook: BeforeLeaveHook, options?: BeforeLeaveOptions): () => void {
		return this.#leave.add(hook, options);
	}

	/** App-relative path for a full pathname, or null when outside `base`. */
	toAppPath(pathname: string): string | null {
		return this.#base.toApp(pathname);
	}

	href(to: string): string {
		return this.#base.href(to);
	}

	navigate(to: string, options: NavigateOptions = {}): Promise<void> {
		const u = new URL(to, 'http://router.local' + this.location.peek().pathname);
		const result = this.#nav.navigate(this.href(u.pathname) + u.search + u.hash, {
			history: options.replace ? 'replace' : 'push',
			state: options.state,
		});
		return swallowAbort(result.finished);
	}

	back(): Promise<void> {
		return swallowAbort(this.#nav.back().finished);
	}

	forward(): Promise<void> {
		return swallowAbort(this.#nav.forward().finished);
	}

	/** Begins listening and resolves the current URL. Idempotent. */
	start(): Promise<void> {
		if (this.#started) return Promise.resolve();
		this.#started = true;
		const onNavigate = (e: Event): void => this.#onNavigate(e as NavigateEventLike);
		this.#nav.addEventListener('navigate', onNavigate);
		this.#stopListening = () => this.#nav.removeEventListener('navigate', onNavigate);
		this.#leave.setActive(true);
		return this.#reresolve();
	}

	stop(): void {
		this.#started = false;
		this.#leave.setActive(false);
		this.#stopListening?.();
		this.#stopListening = null;
		this.#tx?.abort();
	}

	// ---- entry point 1: the browser navigates (link click, back/forward, navigation.navigate) ----

	#onNavigate(e: NavigateEventLike): void {
		if (!e.canIntercept || e.hashChange || e.downloadRequest !== null || e.formData) return;
		const url = new URL(e.destination.url);
		const pathname = this.toAppPath(url.pathname);
		if (pathname === null) return;
		const to: RouteLocation = { pathname, search: url.search, hash: url.hash, state: e.destination.getState() };

		let tx!: Transaction;
		let plan!: GoPlan;
		e.intercept({
			// Before the URL commits: a block cancels the navigation, a redirect changes its target.
			precommitHandler: async (controller) => {
				tx = this.#begin(e.signal);
				const planned = await this.#plan(to, !isRedirect(e.info), tx);
				if (!planned) throw abortError();
				if (planned.kind === 'block') {
					this.#settle(tx);
					throw abortError();
				}
				plan = planned;
				if (plan.to !== to) {
					controller.redirect(this.href(plan.to.pathname) + plan.to.search + plan.to.hash, {
						history: 'replace',
						state: to.state,
						info: REDIRECT_INFO,
					});
				}
			},
			// After the URL commits: load and publish.
			handler: () => this.#load(plan, tx),
		});
	}

	// ---- entry point 2: no browser event (start, route registered/removed) ----

	// Route registration is bursty (one per <std-route>); coalesce into a single re-resolve.
	#invalidate(): void {
		if (!this.#started || this.#invalidateQueued) return;
		this.#invalidateQueued = true;
		queueMicrotask(() => {
			this.#invalidateQueued = false;
			if (this.#started) void this.#reresolve();
		});
	}

	async #reresolve(): Promise<void> {
		const tx = this.#begin();
		const requested = this.#readLocation();
		const plan = await this.#plan(requested, false, tx);
		if (!plan) return;
		if (plan.kind === 'block') return this.#settle(tx);
		if (plan.to !== requested) {
			// A redirect with no navigation event to attach it to, so navigate; that event re-plans without leave hooks.
			void swallowAbort(
				this.#nav.navigate(this.href(plan.to.pathname) + plan.to.search + plan.to.hash, {
					history: 'replace',
					state: plan.to.state,
					info: REDIRECT_INFO,
				}).finished,
			);
			return;
		}
		await this.#load(plan, tx);
	}

	// ---- the three steps ----

	/** Starting a transaction supersedes the previous one. */
	#begin(browserSignal?: AbortSignal): Transaction {
		this.#tx?.abort();
		return (this.#tx = new Transaction(browserSignal));
	}

	/** Plan: may this navigation happen, and where does it end? */
	#plan(to: RouteLocation, leaving: boolean, tx: Transaction): Promise<Plan | null> {
		return planNavigation({
			routes: this.routes,
			leave: this.#leave,
			from: this.location.peek(),
			to,
			leaving,
			signal: tx.signal,
			isStale: () => tx.stale,
		});
	}

	/** Load, then Commit. A superseded transaction never commits. */
	async #load(plan: GoPlan, tx: Transaction): Promise<void> {
		this.status.set('loading');
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
		this.#commit(plan, results, error);
	}

	/** A navigation that ends without committing leaves the status as the committed state says. */
	#settle(tx: Transaction): void {
		if (this.#tx === tx) this.status.set(this.error.peek() === undefined ? 'idle' : 'error');
	}

	#commit(plan: GoPlan, results: ReadonlyMap<RouteDef, unknown>, error: unknown): void {
		this.location.set(plan.to);
		this.matches.set(plan.matches);
		this.data.set(results);
		this.error.set(error);
		this.status.set(error === undefined ? 'idle' : 'error');
		if (plan.matches.length === 0) warnNotFound(plan.to.pathname);
		const title = [...plan.matches].reverse().find((m) => m.route.title)?.route.title;
		if (title !== undefined && typeof document !== 'undefined') document.title = title;
	}

	#readLocation(): RouteLocation {
		const entry = this.#nav.currentEntry;
		const u = new URL(entry?.url ?? '/', 'http://router.local');
		return {
			pathname: this.toAppPath(u.pathname) ?? u.pathname,
			search: u.search,
			hash: u.hash,
			state: entry?.getState(),
		};
	}
}

export function createRouter(options?: RouterOptions): Router {
	return new Router(options);
}
