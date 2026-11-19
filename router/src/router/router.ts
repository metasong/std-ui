import { computed, signal, type Computed, type Signal } from '@std-ui/core';
import { withPrecommit } from '../navigation/precommit-shim.js';
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
import { swallowAbort } from './abort.js';
import { BasePath } from './base-path.js';
import { checkNavigation } from './guards.js';
import { interceptWithGuards } from './intercept.js';
import { LeaveHooks } from './leave-hooks.js';
import { loadMatches } from './loader.js';
import { RouteTable } from './route-table.js';

export interface RouterOptions {
	routes?: RouteDef[];
	/** Path prefix the app is mounted under, e.g. `/app`. */
	base?: string;
	/** Defaults to `window.navigation`; throws if absent. */
	navigation?: NavigationLike;
}

/** Reactive state and navigation wiring; matching, guards, loading and hooks live in sibling modules. */
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
	#ctrl: AbortController | null = null;
	#seq = 0;
	#redirecting = false;
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
		return this.#resolve(this.#readLocation());
	}

	stop(): void {
		this.#started = false;
		this.#leave.setActive(false);
		this.#stopListening?.();
		this.#stopListening = null;
		this.#ctrl?.abort();
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

	// Route registration is bursty (one per <std-route>); coalesce into a single re-resolve.
	#invalidate(): void {
		if (!this.#started || this.#invalidateQueued) return;
		this.#invalidateQueued = true;
		queueMicrotask(() => {
			this.#invalidateQueued = false;
			if (this.#started) void this.#resolve(this.#readLocation());
		});
	}

	#check(to: RouteLocation, signal: AbortSignal, leaving: boolean, isStale: () => boolean) {
		return checkNavigation({
			routes: this.routes,
			leave: this.#leave,
			from: this.location.peek(),
			to,
			signal,
			leaving,
			isStale,
		});
	}

	#onNavigate(e: NavigateEventLike): void {
		if (!e.canIntercept || e.hashChange || e.downloadRequest !== null || e.formData) return;
		const url = new URL(e.destination.url);
		const pathname = this.toAppPath(url.pathname);
		if (pathname === null) return;
		const to: RouteLocation = { pathname, search: url.search, hash: url.hash, state: e.destination.getState() };

		// A redirect re-enters here as a new navigation; its leave hooks already ran for the original.
		const leaving = !this.#redirecting;
		this.#redirecting = false;

		interceptWithGuards(e, to, leaving, {
			check: (t, signal, leave, isStale) => this.#check(t, signal, leave, isStale),
			href: (path) => this.href(path),
			resolve: (t, approved, signal) => this.#resolve(t, approved, signal),
		});
	}

	/** `approved` comes from the precommit phase; without it (initial/re-resolve) the checks run here. */
	async #resolve(to: RouteLocation, approved?: RouteMatch[], navSignal?: AbortSignal): Promise<void> {
		this.#ctrl?.abort();
		const ctrl = (this.#ctrl = new AbortController());
		navSignal?.addEventListener('abort', () => ctrl.abort());
		const seq = ++this.#seq;
		const stale = (): boolean => seq !== this.#seq;
		this.status.set('loading');

		let matches: RouteMatch[] = [];
		let results: ReadonlyMap<RouteDef, unknown> = new Map();
		let error: unknown;

		try {
			if (approved) matches = approved;
			else {
				const verdict = await this.#check(to, ctrl.signal, false, stale);
				if (!verdict) return;
				if (verdict.kind === 'redirect') return this.#redirect(verdict.path, to);
				if (verdict.kind === 'block') {
					this.status.set('idle');
					return;
				}
				matches = verdict.matches;
			}
			results = await loadMatches(matches, to, ctrl.signal);
			if (stale()) return;
		} catch (err) {
			if (stale()) return;
			error = err;
		}

		this.location.set(to);
		this.matches.set(matches);
		this.data.set(results);
		this.error.set(error);
		this.status.set(error === undefined ? 'idle' : 'error');
		const title = [...matches].reverse().find((m) => m.route.title)?.route.title;
		if (title !== undefined && typeof document !== 'undefined') document.title = title;
	}

	#redirect(path: string, from: RouteLocation): void {
		this.#redirecting = true;
		void swallowAbort(this.#nav.navigate(this.href(path), { history: 'replace', state: from.state }).finished);
	}
}

export function createRouter(options?: RouterOptions): Router {
	return new Router(options);
}
