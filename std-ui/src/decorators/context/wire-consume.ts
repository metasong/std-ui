// Context, consume side: called by `UIElement.connectedCallback()` (`../../ui-element.ts`) to
// resolve every `@consume(contextKey)` field (`./consume.decorator.ts`) on a just-connected host
// against the nearest ancestor provider, synchronously. Lives here (rather than inline in
// `ui-element.ts`) because it's purely about the context protocol - same reasoning as the rest of
// this folder.

import { signalState } from '../../signal/index.js';
import { getConsumedContextDefs } from './metadata.js';
import { ContextRequestEvent } from './request-event.js';

/**
 * For each `@consume(contextKey)` field recorded on `host`'s constructor, dispatches a
 * `ContextRequestEvent` from `host` to find the nearest ancestor provider, then redefines the
 * field on `host` as a reactive accessor backed by `signalState(undefined)` kept in sync with the provider's
 * value. Throws if no ancestor currently provides a given field's `contextKey`.
 */
export function wireConsumedContextFields(host: HTMLElement): void {
	for (const def of getConsumedContextDefs(host.constructor)) {
		const value = signalState<unknown>(undefined);
		let found = false;
		host.dispatchEvent(new ContextRequestEvent(def.contextKey, next => {
			found = true;
			value.set(next);
		}));
		if (!found) {
			throw new Error(
				`@consume() field "${String(def.key)}" on <${host.tagName.toLowerCase()}> found no ancestor ` +
					`providing context "${def.contextKey.description}" - add a matching @state({ contextKey }) ` +
					`further up the tree.`,
			);
		}
		Object.defineProperty(host, def.key, {
			get(): unknown {
				return value();
			},
			set(): void {
				throw new Error(`@consume() field "${String(def.key)}" is read-only - its value comes from the provider.`);
			},
			enumerable: true,
			configurable: true,
		});
	}
}
