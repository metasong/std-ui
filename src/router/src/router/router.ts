import type { Computed, Signal } from '@std-ui/core';
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
import { abortError, swallowAbort } from './abort.js';
import { Announcer, defaultAnnounce, type AnnounceOption } from './announcer.js';
import { BasePath } from './base-path.js';
import { LeaveHooks } from './leave-hooks.js';
import { Pipeline } from './pipeline.js';
import { isRedirect, REDIRECT_INFO, type GoPlan } from './plan.js';
import { RouteTable } from './route-table.js';
import { RouterState } from './state.js';
import type { Transaction } from './transaction.js';
import type { ViewTransitionHooks } from './view-transition.js';

export interface RouterOptions {
	routes?: RouteDef[];
	/** Path prefix the app is mounted under, e.g. `/app`. */
	base?: string;
	/** Defaults to `window.navigation`; throws if absent. */
	navigation?: NavigationLike;
	/**
	 * Screen-reader announcement after each client-side navigation (not the initial load), via a
	 * hidden `aria-live` region. `true` (default) uses the route title, else the first `<h1>`, else
	 * the path; pass a function to customise (return empty to stay silent); `false` disables.
	 */
	announce?: AnnounceOption;
	/**
	 * Wrap each commit in `document.startViewTransition` when supported and motion is allowed. Default false.
	 * Pass `{ onStart, onFinish }` to scope a `view-transition-name` to the transition's lifetime.
	 */
	viewTransition?: boolean | ViewTransitionHooks;
}

/**
 * Public facade. State lives in `RouterState`, the Plan → Load → Commit steps in `Pipeline`;
 * this class wires the browser to them through two entry points (`#onNavigate`, `#reresolve`).
 */
export class Router {
	readonly location: Signal<RouteLocation>;
	readonly matches: Signal<RouteMatch[]>;
	readonly status: Signal<RouterStatus>;
	readonly error: Signal<unknown>;
	/** `load()` results keyed by route. */
	readonly data: Signal<ReadonlyMap<RouteDef, unknown>>;
	readonly params: Computed<Record<string, string>>;

	readonly #nav: NavigationLike;
	#base: BasePath;
	readonly #table: RouteTable;
	readonly #leave = new LeaveHooks();
	readonly #pipeline: Pipeline;
	readonly #announcer?: Announcer;
	#started = false;
	#stopListening: (() => void) | null = null;
	#invalidateQueued = false;

	constructor(options: RouterOptions = {}) {
		const nav = options.navigation ?? (globalThis as { navigation?: NavigationLike }).navigation;
		if (!nav) throw new Error('@std-ui/router requires the Navigation API (window.navigation).');
		this.#nav = withPrecommit(nav);
		this.#base = new BasePath(options.base);
		this.#table = new RouteTable(options.routes ?? [], () => this.#invalidate());
		const state = new RouterState(this.#readLocation());
		const announce = options.announce ?? true;
		if (announce !== false) this.#announcer = new Announcer(announce === true ? defaultAnnounce : announce);
		this.#pipeline = new Pipeline(this.#table, this.#leave, state, {
			viewTransition: options.viewTransition,
			announcer: this.#announcer,
		});
		({ location: this.location, matches: this.matches, status: this.status, error: this.error, data: this.data, params: this.params } = state);
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

	/** Path prefix the app is mounted under. Setting it re-resolves the current URL when the router is running. */
	get base(): string {
		return this.#base.prefix;
	}

	set base(value: string) {
		const next = new BasePath(value);
		if (next.prefix === this.#base.prefix) return;
		this.#base = next;
		this.#invalidate();
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

	/**
	 * Adds hooks that run around each view transition (needs `viewTransition` enabled), in addition to those
	 * in the option. Returns a function that removes them. Used by `<std-outlet view-transition-name>`.
	 */
	addViewTransitionHooks(hooks: ViewTransitionHooks): () => void {
		return this.#pipeline.addViewTransitionHooks(hooks);
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
		this.#pipeline.abort();
		this.#announcer?.dispose();
	}

	// ---- entry point 1: the browser navigates (link click, back/forward, navigation.navigate) ----

	#onNavigate(e: NavigateEventLike): void {
		if (!e.canIntercept || e.hashChange || e.downloadRequest !== null || e.formData) return;
		const url = new URL(e.destination.url);
		const pathname = this.toAppPath(url.pathname);
		if (pathname === null) return;
		const to: RouteLocation = { pathname, search: url.search, hash: url.hash, state: e.destination.getState() };

		const p = this.#pipeline;
		let tx!: Transaction;
		let plan!: GoPlan;
		e.intercept({
			// Before the URL commits: a block cancels the navigation, a redirect changes its target.
			precommitHandler: async (controller) => {
				tx = p.begin(e.signal);
				const planned = await p.plan(to, !isRedirect(e.info), tx);
				if (!planned) throw abortError();
				if (planned.kind === 'block') {
					p.settle(tx);
					throw abortError();
				}
				plan = planned;
				if (plan.to !== to) {
					controller.redirect(this.#base.url(plan.to), { history: 'replace', state: to.state, info: REDIRECT_INFO });
				}
			},
			// After the URL commits: load and publish.
			handler: () => p.load(plan, tx),
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
		const p = this.#pipeline;
		const tx = p.begin();
		const requested = this.#readLocation();
		const plan = await p.plan(requested, false, tx);
		if (!plan) return;
		if (plan.kind === 'block') return p.settle(tx);
		if (plan.to !== requested) {
			// A redirect with no navigation event to attach it to, so navigate; that event re-plans without leave hooks.
			void swallowAbort(
				this.#nav.navigate(this.#base.url(plan.to), { history: 'replace', state: plan.to.state, info: REDIRECT_INFO }).finished,
			);
			return;
		}
		await p.load(plan, tx);
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
