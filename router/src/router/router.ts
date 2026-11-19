import { computed, signal, type Computed, type Signal } from '@std-ui/core';
import { fillParams, matchRoutes } from '../match/matcher.js';
import type { NavigateEventLike, NavigationEntryLike, NavigationLike } from '../navigation/types.js';
import type { NavigateOptions, RouteContext, RouteDef, RouteLocation, RouteMatch, RouterStatus } from '../types.js';

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
	#started = false;
	#stopListening: (() => void) | null = null;
	#ctrl: AbortController | null = null;
	#seq = 0;
	#reverting = false;
	#invalidateQueued = false;

	constructor(options: RouterOptions = {}) {
		const nav = options.navigation ?? (globalThis as { navigation?: NavigationLike }).navigation;
		if (!nav) throw new Error('@std-ui/router requires the Navigation API (window.navigation).');
		this.#nav = nav;
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
		return this.#resolve(this.#readLocation(), null, null);
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
			if (this.#started) void this.#resolve(this.#readLocation(), null, null);
		});
	}

	#onNavigate(e: NavigateEventLike): void {
		if (this.#reverting) {
			this.#reverting = false;
			return;
		}
		if (!e.canIntercept || e.hashChange || e.downloadRequest !== null || e.formData) return;
		const url = new URL(e.destination.url);
		const pathname = this.toAppPath(url.pathname);
		if (pathname === null) return;
		const to: RouteLocation = { pathname, search: url.search, hash: url.hash, state: e.destination.getState() };
		const from = this.#nav.currentEntry;
		e.intercept({ handler: () => this.#resolve(to, e, from) });
	}

	async #resolve(to: RouteLocation, event: NavigateEventLike | null, from: NavigationEntryLike | null): Promise<void> {
		this.#ctrl?.abort();
		const ctrl = (this.#ctrl = new AbortController());
		event?.signal.addEventListener('abort', () => ctrl.abort());
		const seq = ++this.#seq;
		const stale = (): boolean => seq !== this.#seq;
		this.status.set('loading');

		let matches: RouteMatch[] = [];
		const results = new Map<RouteDef, unknown>();
		let error: unknown;

		try {
			const ctxOf = (m: RouteMatch): RouteContext => ({
				location: to,
				params: m.params,
				search: new URLSearchParams(to.search),
				signal: ctrl.signal,
				route: m.route,
			});

			matches = matchRoutes(this.routes, to.pathname) ?? [];

			for (const m of matches) {
				if (m.route.redirect !== undefined) return this.#redirect(fillParams(m.route.redirect, m.params), to);
			}
			for (const m of matches) {
				const verdict = await m.route.guard?.(ctxOf(m));
				if (stale()) return;
				if (typeof verdict === 'string') return this.#redirect(verdict, to);
				if (verdict === false) {
					this.#revert(event, from);
					this.status.set('idle');
					return;
				}
			}

			await Promise.all(
				matches.map(async (m) => {
					await m.route.lazy?.();
					results.set(m.route, await m.route.load?.(ctxOf(m)));
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
		void swallowAbort(this.#nav.navigate(this.href(path), { history: 'replace', state: from.state }).finished);
	}

	// A blocked guard runs after the browser already committed the URL, so undo that entry.
	#revert(event: NavigateEventLike | null, from: NavigationEntryLike | null): void {
		if (!event || !from) return;
		this.#reverting = true;
		let result;
		if (event.navigationType === 'traverse') result = this.#nav.traverseTo(from.key);
		else if (event.navigationType === 'push') result = this.#nav.back();
		else if (from.url) result = this.#nav.navigate(from.url, { history: 'replace', state: from.getState() });
		else this.#reverting = false;
		if (result) void swallowAbort(result.finished);
	}
}

function swallowAbort(p: Promise<unknown>): Promise<void> {
	return p.then(
		() => undefined,
		(err: { name?: string }) => {
			if (err?.name !== 'AbortError') throw err;
		},
	);
}

export function createRouter(options?: RouterOptions): Router {
	return new Router(options);
}
