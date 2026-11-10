// Context, provide side: called by `UIElement.connectedCallback()` (`../../ui-element.ts`) to wire
// one `context-request` listener per `@state({ contextKey })` field on a just-connected host.
// `stopPropagation()` on a match gives nearest-provider-wins — see `./request-event.ts`.

import { effect as createEffect } from '../../signal/index.js';
import { readValue, type ItemNode } from '../../signal/tree/index.js';
import { getProvidedContextDefs } from './metadata.js';
import { CONTEXT_REQUEST_EVENT, ContextRequestEvent } from './request-event.js';

/**
 * For each `@state({ contextKey })` field recorded on `host`'s constructor, registers a
 * `context-request` listener that responds to matching requests with the field's current (and
 * ever-changing) value. Listener disposers go to `registerListenerDisposer`, the per-match
 * effect's disposer to `registerEffectDisposer` - both so the caller can dispose them on
 * disconnect.
 */
export function wireProvidedContextListeners(
	host: HTMLElement,
	registerEffectDisposer: (dispose: () => void) => void,
	registerListenerDisposer: (dispose: () => void) => void,
): void {
	for (const def of getProvidedContextDefs(host.constructor)) {
		const listener = (event: Event): void => {
			const request = event as ContextRequestEvent<unknown>;
			if (request.contextKey !== def.contextKey) return;
			request.stopPropagation();
			registerEffectDisposer(createEffect(() => {
				request.callback(readValue((host as unknown as Record<PropertyKey, ItemNode<unknown>>)[def.key]));
			}));
		};
		host.addEventListener(CONTEXT_REQUEST_EVENT, listener);
		registerListenerDisposer(() => host.removeEventListener(CONTEXT_REQUEST_EVENT, listener));
	}
}
