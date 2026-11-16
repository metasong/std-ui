// The event a `@consume()` field (`./wire-consume.ts`) dispatches to find its value, and a
// `@provide(key)` provider (`./wire-provide.ts`) listens for - wired together by
// `../../element/ui-element.ts`. Modeled on `lit`'s `context-request` protocol (same event name/shape) because
// it already solves the hard part for free: a `bubbles: true, composed: true` DOM event walks up
// through the actual rendered tree - including across shadow-root boundaries - and visits the
// *nearest* ancestor first, so a provider calling `stopPropagation()` on the first matching event
// it sees automatically implements "nearest provider wins", including a descendant re-providing
// the same key to override it for its own descendants - no separate tree-walking code needed.

import type { ContextKey } from './key.js';

/** Event name both sides listen for/dispatch - exported for tests; not meant to be used directly. */
export const CONTEXT_REQUEST_EVENT = 'context-request';

/**
 * Dispatched by a `@consume(contextKey)` field's host element when it connects. A provider whose
 * `contextKey` matches calls `stopPropagation()` (so no further ancestor provider also responds)
 * and then calls `callback()` once immediately with the current value, and again every time that
 * value changes, for as long as both the provider and the requester stay connected.
 */
export class ContextRequestEvent<T = unknown> extends Event {
	constructor(
		public readonly contextKey: ContextKey<T>,
		public readonly callback: (value: T) => void,
	) {
		super(CONTEXT_REQUEST_EVENT, { bubbles: true, composed: true, cancelable: true });
	}
}
