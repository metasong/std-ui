import { computed, state, type Computed, type State } from '@std-ui/core';
import { warnNotFound } from '../dev/warn.js';
import type { RouteDef, RouteLocation, RouteMatch, RouterStatus } from '../types.js';
import type { GoPlan } from './plan.js';

/** The router's observable state. `commit` is the only writer, so state never half-updates. */
export class RouterState {
	readonly location: State<RouteLocation>;
	readonly matches: State<RouteMatch[]> = state<RouteMatch[]>([]);
	readonly status: State<RouterStatus> = state<RouterStatus>('idle');
	readonly error: State<unknown> = state<unknown>(undefined);
	/** `load()` results keyed by route. */
	readonly data: State<ReadonlyMap<RouteDef, unknown>> = state<ReadonlyMap<RouteDef, unknown>>(new Map());
	readonly params: Computed<Record<string, string>>;

	constructor(initial: RouteLocation) {
		this.location = state(initial);
		this.params = computed(() => this.matches().at(-1)?.params ?? {});
	}

	loading(): void {
		this.status.set('loading');
	}

	/** A navigation ended without committing: status falls back to what the committed state says. */
	settle(): void {
		this.status.set(this.error.peek() === undefined ? 'idle' : 'error');
	}

	commit(plan: GoPlan, results: ReadonlyMap<RouteDef, unknown>, error: unknown): void {
		this.location.set(plan.to);
		this.matches.set(plan.matches);
		this.data.set(results);
		this.error.set(error);
		this.status.set(error === undefined ? 'idle' : 'error');
		if (plan.matches.length === 0) warnNotFound(plan.to.pathname);
		const title = [...plan.matches].reverse().find((m) => m.route.title)?.route.title;
		if (title !== undefined && typeof document !== 'undefined') document.title = title;
	}
}
