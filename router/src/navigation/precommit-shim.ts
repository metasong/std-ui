import type { NavigateEventLike, NavigationEntryLike, NavigationLike, PrecommitControllerLike } from './types.js';

type InterceptOptions = Parameters<NavigateEventLike['intercept']>[0];
type Handler = () => Promise<void> | void;

/** Native `NavigationPrecommitController` (Chrome 146+, Firefox 148+; not Safari). */
export const supportsPrecommit = (): boolean => 'NavigationPrecommitController' in globalThis;

/**
 * Makes `intercept({ precommitHandler })` available on engines without it, so the router is written
 * only against the native API. Returns `nav` untouched when the engine supports it.
 *
 * Emulation: `precommitHandler` runs as the first step of `handler`, i.e. after the URL has
 * committed. A rejection reverts that entry (and rethrows); `controller.redirect()` re-navigates with
 * `history: 'replace'` and runs the original `handler` for the target instead of re-entering listeners.
 */
export function withPrecommit(nav: NavigationLike, native = supportsPrecommit()): NavigationLike {
	if (native) return nav;

	const wrapped = new Map<EventListenerOrEventListenerObject, EventListener>();
	// Navigations the shim itself starts must not reach the router's listener.
	let skipNext = false;
	let bypass: Handler | null = null;

	const revert = (event: NavigateEventLike, from: NavigationEntryLike | null): void => {
		if (!from) return;
		let result;
		skipNext = true;
		try {
			if (event.navigationType === 'traverse') result = nav.traverseTo(from.key);
			else if (event.navigationType === 'push') result = nav.back();
			else if (from.url) result = nav.navigate(from.url, { history: 'replace', state: from.getState() });
			else skipNext = false;
		} catch (err) {
			skipNext = false;
			throw err;
		}
		result?.finished?.catch(() => {});
	};

	const intercept = (event: NavigateEventLike, options: InterceptOptions): void => {
		const { precommitHandler, handler, ...rest } = options ?? {};
		if (!precommitHandler) return event.intercept(options);

		const from = nav.currentEntry;
		event.intercept({
			...rest,
			handler: async () => {
				const later: Handler[] = [];
				const taken: { target?: { url: string; state: unknown; hasState: boolean } } = {};
				const controller = {
					redirect(url, opts) {
						taken.target = { url: String(url), state: opts?.state, hasState: !!opts && 'state' in opts };
					},
					// Post-commit handlers are already "after commit" here, so they just run after `handler`'s peers.
					addHandler: (h: Handler) => void later.push(h),
				} satisfies PrecommitControllerLike & { addHandler(h: Handler): void };
				try {
					await precommitHandler(controller as never);
				} catch (err) {
					revert(event, from);
					throw err;
				}
				const { target } = taken;
				if (target) {
					bypass = async () => {
						for (const h of later) await h();
						await handler?.();
					};
					const result = nav.navigate(target.url, {
						history: 'replace',
						state: target.hasState ? target.state : event.destination.getState(),
					});
					await result.finished;
					return;
				}
				for (const h of later) await h();
				await handler?.();
			},
		});
	};

	// Presents the event as cancelable so the router uses the precommit path for every navigation.
	const present = (event: NavigateEventLike): NavigateEventLike =>
		new Proxy(event, {
			get(target, prop) {
				if (prop === 'intercept') return (options: InterceptOptions) => intercept(target, options);
				if (prop === 'cancelable') return true;
				const value = Reflect.get(target, prop, target);
				return typeof value === 'function' ? value.bind(target) : value;
			},
		});

	const view: Partial<NavigationLike> & EventTarget = {
		get currentEntry() {
			return nav.currentEntry;
		},
		navigate: (...args) => nav.navigate(...args),
		back: () => nav.back(),
		forward: () => nav.forward(),
		traverseTo: (key) => nav.traverseTo(key),
		dispatchEvent: (event) => nav.dispatchEvent(event),
		addEventListener(type, listener, options) {
			if (type !== 'navigate' || !listener) return nav.addEventListener(type, listener, options);
			const inner: EventListener = (event) => {
				if (skipNext) {
					skipNext = false;
					return;
				}
				if (bypass) {
					const run = bypass;
					bypass = null;
					(event as NavigateEventLike).intercept({ handler: run });
					return;
				}
				const arg = present(event as NavigateEventLike) as unknown as Event;
				if (typeof listener === 'function') listener(arg);
				else listener.handleEvent(arg);
			};
			wrapped.set(listener, inner);
			nav.addEventListener(type, inner, options);
		},
		removeEventListener(type, listener, options) {
			const inner = listener ? wrapped.get(listener) : undefined;
			if (inner) wrapped.delete(listener!);
			nav.removeEventListener(type, inner ?? listener, options);
		},
	};
	return view as NavigationLike;
}
