import type {
	NavigateEventLike,
	NavigationEntryLike,
	NavigationLike,
	PrecommitControllerLike,
} from '../navigation/types.js';

type NavType = NavigateEventLike['navigationType'];
type HistoryMode = 'auto' | 'push' | 'replace';
// Looser than lib.dom's NavigationResult (entries are not modelled); the final cast to NavigationLike covers it.
interface Settled {
	committed: Promise<unknown>;
	finished: Promise<unknown>;
}
type Handler = () => Promise<void> | void;
type PrecommitHandler = (controller: PrecommitControllerLike) => Promise<void> | void;

/**
 * In-memory stand-in for `window.navigation` (jsdom has none). Mirrors the parts the router relies
 * on: without a `precommitHandler` the URL commits before the intercept handler runs; with one it
 * commits after (and a rejection cancels the navigation); a newer navigation aborts the older one's signal.
 */
export function createMemoryNavigation(initialUrl = '/', origin = 'http://router.local'): NavigationLike {
	const bus = new EventTarget();
	let counter = 0;
	const makeEntry = (url: string, state: unknown): NavigationEntryLike => ({
		key: String(counter++),
		url,
		getState: () => state,
	});
	const entries: NavigationEntryLike[] = [makeEntry(new URL(initialUrl, origin).href, undefined)];
	let idx = 0;
	let pending: AbortController | null = null;

	const abortError = (): DOMException => new DOMException('Navigation aborted', 'AbortError');

	function run(
		type: NavType,
		url: string,
		state: unknown,
		commit: (href: string, state: unknown, forceReplace: boolean) => void,
		info?: unknown,
	): Settled {
		const href = new URL(url, entries[idx]!.url!).href;
		pending?.abort();
		const ctrl = new AbortController();
		pending = ctrl;
		let handler: Handler | undefined;
		let precommit: PrecommitHandler | undefined;
		const event = Object.assign(new Event('navigate', { cancelable: true }), {
			canIntercept: true,
			hashChange: false,
			downloadRequest: null,
			formData: null,
			navigationType: type,
			info,
			destination: { url: href, getState: () => state },
			signal: ctrl.signal,
			intercept(options?: { handler?: Handler; precommitHandler?: PrecommitHandler }) {
				handler = options?.handler;
				precommit = options?.precommitHandler;
			},
		}) as NavigateEventLike;
		bus.dispatchEvent(event);

		let committed: Promise<unknown>;
		if (precommit) {
			let finalHref = href;
			let finalState = state;
			let forceReplace = false;
			const controller: PrecommitControllerLike = {
				redirect(to, options) {
					finalHref = new URL(to, href).href;
					if ('state' in (options ?? {})) finalState = options!.state;
					forceReplace = options?.history === 'replace';
				},
			};
			committed = Promise.resolve()
				.then(() => precommit!(controller))
				.then(() => {
					if (ctrl.signal.aborted) throw abortError();
					commit(finalHref, finalState, forceReplace);
				});
		} else {
			commit(href, state, false);
			committed = Promise.resolve();
		}

		const finished = committed
			.then(() => handler?.())
			.then(() => {
				if (ctrl.signal.aborted) throw abortError();
			});
		// A cancelled navigation that nobody awaits must not surface as an unhandled rejection.
		committed.catch(() => {});
		finished.catch(() => {});
		return { committed, finished };
	}

	const traverse = (to: number): Settled => {
		const entry = entries[to];
		if (!entry) throw new DOMException('No such entry', 'InvalidStateError');
		return run('traverse', entry.url!, entry.getState(), () => {
			idx = to;
		});
	};

	const nav = Object.assign(bus, {
		navigate(url: string, options: { history?: HistoryMode; state?: unknown; info?: unknown } = {}) {
			const replace = options.history === 'replace';
			return run(
				replace ? 'replace' : 'push',
				url,
				options.state,
				(href, state, forceReplace) => {
					const entry = makeEntry(href, state);
					if (replace || forceReplace) entries[idx] = entry;
					else {
						entries.splice(idx + 1);
						entries.push(entry);
						idx++;
					}
				},
				options.info,
			);
		},
		back: () => traverse(idx - 1),
		forward: () => traverse(idx + 1),
		traverseTo(key: string) {
			const to = entries.findIndex((e) => e.key === key);
			return traverse(to);
		},
	});
	// Object.assign would snapshot a getter's value, so define it separately.
	Object.defineProperty(nav, 'currentEntry', { get: () => entries[idx] ?? null });
	return nav as unknown as NavigationLike;
}
