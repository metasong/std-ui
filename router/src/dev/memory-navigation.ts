import type { NavigateEventLike, NavigationEntryLike, NavigationLike, NavigationResultLike } from '../navigation/types.js';

type NavType = NavigateEventLike['navigationType'];

/**
 * In-memory stand-in for `window.navigation` (jsdom has none). Mirrors the parts the router relies
 * on: the URL commits before the intercept handler runs, and a newer navigation aborts the older one's signal.
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

	function run(type: NavType, url: string, state: unknown, commit: (href: string) => void): NavigationResultLike {
		const href = new URL(url, entries[idx]!.url!).href;
		pending?.abort();
		const ctrl = new AbortController();
		pending = ctrl;
		let handler: (() => Promise<void> | void) | undefined;
		const event = Object.assign(new Event('navigate', { cancelable: true }), {
			canIntercept: true,
			hashChange: false,
			downloadRequest: null,
			formData: null,
			navigationType: type,
			destination: { url: href, getState: () => state },
			signal: ctrl.signal,
			intercept(options?: { handler?: () => Promise<void> | void }) {
				handler = options?.handler;
			},
		}) as NavigateEventLike;
		bus.dispatchEvent(event);
		commit(href);
		const finished = Promise.resolve()
			.then(() => handler?.())
			.then(() => {
				if (ctrl.signal.aborted) throw new DOMException('Navigation aborted', 'AbortError');
			});
		return { committed: Promise.resolve(), finished };
	}

	const traverse = (to: number): NavigationResultLike => {
		const entry = entries[to];
		if (!entry) throw new DOMException('No such entry', 'InvalidStateError');
		return run('traverse', entry.url!, entry.getState(), () => {
			idx = to;
		});
	};

	const nav = Object.assign(bus, {
		navigate(url: string, options: { history?: 'auto' | 'push' | 'replace'; state?: unknown } = {}) {
			const replace = options.history === 'replace';
			return run(replace ? 'replace' : 'push', url, options.state, (href) => {
				const entry = makeEntry(href, options.state);
				if (replace) entries[idx] = entry;
				else {
					entries.splice(idx + 1);
					entries.push(entry);
					idx++;
				}
			});
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
