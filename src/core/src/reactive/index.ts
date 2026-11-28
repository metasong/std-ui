export { Computed, computed, isState, isWritableSignal, markSignal, peekSignal, State, state, type ReadableSignal, type SignalOptions, type WritableSignal } from './signal/index.js';
export { effect, type OnCleanup } from './effect/index.js';

import {
	assertNotInReactiveContext as _assertNotInReactiveContext,
	inReactiveContext as _inReactiveContext,
	untrack as _untrack,
	Watcher as _Watcher,
} from './signal/index.js';

/** Grouped re-export of the low-level primitives, named after `Signal.subtle` in the proposed
 * standard signals API (`Signal.subtle.Watcher`, `Signal.subtle.untrack`). Most code should use
 * `store()`/`computed()`/`effect()` instead - reach for `subtle` only when building a custom
 * scheduler or framework integration on top of the dependency graph. */
export const subtle = {
	Watcher: _Watcher,
	untrack: _untrack,
	inReactiveContext: _inReactiveContext,
	assertNotInReactiveContext: _assertNotInReactiveContext,
};
