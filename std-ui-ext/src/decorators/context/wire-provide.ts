// Context, provide side: called by `UIElement.connectedCallback()` (std-ui's `UIElement`) to wire
// one `context-request` listener per provided store on a just-connected host - both `@provide(key)`
// fields and `defineElement({ provide })` entries. `stopPropagation()` on a match gives
// nearest-provider-wins — see `./request-event.ts`.

import { effect as createEffect, registerUIElementHooks } from 'std-ui';
import { providedContexts } from './metadata.js';
import { CONTEXT_REQUEST_EVENT, ContextRequestEvent } from './request-event.js';

type ProvidedStore = { (): unknown; deep?: () => unknown };

/** Deep (tracked) read of a store: a state tree's `.deep()`, else the leaf's own value. */
function readValue(store: ProvidedStore): unknown {
	return typeof store.deep === 'function' ? store.deep() : store();
}

/**
 * For each provided store - the class's provider defs (`@provide(key)` or `defineElement({ provide })`),
 * with the store read off the instance - registers a `context-request` listener
 * that responds to matching requests with the store's current (and ever-changing) value. Listener
 * disposers go to `registerListenerDisposer`, the per-match effect's disposer to
 * `registerEffectDisposer` - both so the caller can dispose them on disconnect.
 */
export function wireProvidedContextListeners(
	host: HTMLElement,
	registerEffectDisposer: (dispose: () => void) => void,
	registerListenerDisposer: (dispose: () => void) => void,
): void {
	for (const { key, contextKey } of providedContexts.get(host.constructor)) {
		const store = (host as unknown as Record<PropertyKey, ProvidedStore>)[key];
		const listener = (event: Event): void => {
			const request = event as ContextRequestEvent<unknown>;
			if (request.contextKey !== contextKey) return;
			request.stopPropagation();
			registerEffectDisposer(createEffect(() => {
				request.callback(readValue(store));
			}));
		};
		host.addEventListener(CONTEXT_REQUEST_EVENT, listener);
		registerListenerDisposer(() => host.removeEventListener(CONTEXT_REQUEST_EVENT, listener));
	}
}

registerUIElementHooks({
	beforeConnect(el) {
		const disposers: Array<() => void> = [];
		const add = (dispose: () => void): void => void disposers.push(dispose);
		wireProvidedContextListeners(el, add, add);
		return () => disposers.forEach(dispose => dispose());
	},
});
