// Context, consume side: called by `UIElement.connectedCallback()` (std-ui's `UIElement`) to
// resolve every consumed field of the class (`./metadata.ts`) against the nearest ancestor provider,
// synchronously. Each field becomes a getter over a signal created here, so reads are reactive; the
// signal lives only in that getter's closure.

import { stateTree, type UIElementHooks } from '@std-ui/core';
import type { ContextKey } from './key.js';
import { consumedContexts } from './metadata.js';
import { ContextRequestEvent } from './request-event.js';

/**
 * For each consumed field, dispatches a `ContextRequestEvent` from `host` to find the nearest
 * ancestor provider, which then writes its value - now and on every change - into the field's
 * signal. Throws if no ancestor currently provides a field's `contextKey`.
 */
export function wireConsumedContexts(host: HTMLElement): void {
	for (const { key, contextKey } of consumedContexts.get(host.constructor)) {
		const value = stateTree<unknown, 'value'>(undefined, { depth: 'value' });
		let found = false;
		host.dispatchEvent(new ContextRequestEvent(contextKey as ContextKey<unknown>, next => {
			found = true;
			value.set(next);
		}));
		if (!found) {
			throw new Error(
				`consume() on <${host.tagName.toLowerCase()}> found no ancestor providing context ` +
					`"${contextKey.description}" - add a matching @provide(key) / defineElement({ provide }) ` +
					`further up the tree.`,
			);
		}
		Object.defineProperty(host, key, {
			get: (): unknown => value(),
			set(): void {
				throw new TypeError(`@consume() field "${String(key)}" is read-only - its value comes from the provider.`);
			},
			enumerable: true,
			configurable: true,
		});
	}
}

/** Attached to a class by `@consume` / `defineContext({ consume })`. */
export const consumeHooks: UIElementHooks = {
	connected: el => wireConsumedContexts(el),
};
