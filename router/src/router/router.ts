import { computed, signal, type Computed, type Signal } from '@std-ui/core';
import { fillParams, matchRoutes } from '../match/matcher.js';
import { withPrecommit } from '../navigation/precommit-shim.js';
import type { NavigateEventLike, NavigationLike } from '../navigation/types.js';
import type { BeforeLeaveHook, NavigateOptions, RouteContext, RouteDef, RouteLocation, RouteMatch, RouterStatus } from '../types.js';

export interface RouterOptions {
	routes?: RouteDef[];
	/** Path prefix the app is mounted under, e.g. `/app`. */
	base?: string;
	/** Defaults to `window.navigation`; throws if absent. */
	navigation?: NavigationLike;
}

const MAX_REDIRECTS = 10;

export class Router {
	readonly location: Signal<RouteLocation>;
	readonly matches: Signal<RouteMatch[]> = signal<RouteMatch[]>([]);
	readonly status: Signal<RouterStatus> = signal<RouterStatus>('idle');
	readonly error: Signal<unknown> = signal<unknown>(undefined);
	/** `load()` results keyed by route. */
	readonly data: Signal<ReadonlyMap<RouteDef, unknown>> = signal<ReadonlyMap<RouteDef, unknown>>(new Map());
	readonly params: Computed<Record<string, string>>;

	readonly #nav: NavigationLike;
	readonly #base: string;
	readonly #config: RouteDef[];
	readonly #markup: RouteDef[] = [];
	readonly #leaveHooks = new Set<BeforeLeaveHook>();
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
		this.#base = (options.base ?? '').replace(/\/+$/, '');
		this.#config = options.routes ?? [];
		this.location = signal(this.#readLocation());
		this.params = computed(() => this.matches().at(-1)?.params ?? {});
	}

	get routes(): RouteDef[] {
		return [...this.#config, ...this.#markup];
	}

	/** Registers a route (markup routes pass their parent's def). Returns an unregister function. */
	addRoute(def: RouteDef, parent?: RouteDef): () => void {
		const list = parent ? (parent.children ??= []) : this.#markup;
		list.push(def);
		this.#invalidate();
		return () => {
			const i = list.indexOf(def);
			if (i >= 0) list.splice(i, 1);
			this.#invalidate();
		};
	}

	/**
	 * Runs before every router-handled navigation; return `false` to block it. Use it to guard
	 * unsaved work, e.g. `router.beforeLeave(() => !form.changes.dirty() || confirm('Discard changes?'))`.
	 * Returns an unregister function.
	 */
	beforeLeave(hook: BeforeLeaveHook): () => void {
		this.#leaveHooks.add(hook);
		return () => this.#leaveHooks.delete(hook);
	}

	/** App-relative path for a full pathname, or null when outside `base`. */
	toAppPath(pathname: string): string | null {
		if (!this.#base) return pathname;
		if (pathname === this.#base) return '/';
		return pathname.startsWith(this.#base + '/') ? pathname.slice(this.#base.length) : null;
	}

	href(to: string): string {
		return this.#base + to;
	}

	navigate(to: string, options: NavigateOptions = {}): Promise<void> {
		const from = this.location.peek();
		const u = new URL(to, 'http://router.local' + from.pathname);
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
		return this.#resolve(this.#readLocation());
	}

	stop(): void {
		this.#started = false;
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

	#invalidate(): void {
		if (!this.#started || this.#invalidateQueued) return;
		this.#invalidateQueued = true;
		queueMicrotask(() => {
			this.#invalidateQueued = false;
			if (this.#started) void this.#resolve(this.#readLocation());
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

		// Guards run before the URL commits, so a block simply cancels the navigation.
		let target = to;
		let approved: RouteMatch[] | undefined;
		e.intercept({
			precommitHandler: async (controller) => {
				const stale = (): boolean => e.signal.aborted;
				let verdict = await this.#check(target, e.signal, leaving, stale);
				for (let hops = 0; verdict?.kind === 'redirect'; hops++) {
					if (hops >= MAX_REDIRECTS) throw new Error('Too many redirects');
					const u = new URL(verdict.path, 'http://router.local');
					target = { pathname: u.pathname, search: u.search, hash: u.hash, state: to.state };
					controller.redirect(this.href(verdict.path), { history: 'replace', state: to.state });
					verdict = await this.#check(target, e.signal, false, stale);
				}
				if (!verdict || verdict.kind === 'block') throw abortError();
				approved = verdict.matches;
			},
			handler: () => this.#resolve(target, approved, e.signal),
		});
	}

	/** Redirect attributes, `beforeLeave` hooks, then route guards. Null when superseded. */
	async #check(
		to: RouteLocation,
		signal: AbortSignal,
		leaving: boolean,
		isStale: () => boolean,
	): Promise<Verdict | null> {
		const matches = matchRoutes(this.routes, to.pathname) ?? [];
		for (const m of matches) {
			if (m.route.redirect !== undefined) return { kind: 'redirect', path: fillParams(m.route.redirect, m.params) };
		}
		if (leaving) {
			const ctx = { from: this.location.peek(), to, signal };
			for (const hook of [...this.#leaveHooks]) {
				const verdict = await hook(ctx);
				if (isStale()) return null;
				if (verdict === false) return { kind: 'block' };
			}
		}
		for (const m of matches) {
			const verdict = await m.route.guard?.(this.#ctx(to, m, signal));
			if (isStale()) return null;
			if (typeof verdict === 'string') return { kind: 'redirect', path: verdict };
			if (verdict === false) return { kind: 'block' };
		}
		return { kind: 'ok', matches };
	}

	#ctx(to: RouteLocation, m: RouteMatch, signal: AbortSignal): RouteContext {
		return { location: to, params: m.params, search: new URLSearchParams(to.search), signal, route: m.route };
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
		const results = new Map<RouteDef, unknown>();
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

			await Promise.all(
				matches.map(async (m) => {
					await m.route.lazy?.();
					results.set(m.route, await m.route.load?.(this.#ctx(to, m, ctrl.signal)));
				}),
			);
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

type Verdict =
	| { kind: 'ok'; matches: RouteMatch[] }
	| { kind: 'block' }
	| { kind: 'redirect'; path: string };

const abortError = (): DOMException => new DOMException('Navigation blocked', 'AbortError');

function swallowAbort(p: Promise<unknown> | undefined): Promise<void> {
	return Promise.resolve(p).then(
		() => undefined,
		(err: { name?: string }) => {
			if (err?.name !== 'AbortError') throw err;
		},
	);
}

export function createRouter(options?: RouterOptions): Router {
	return new Router(options);
}
