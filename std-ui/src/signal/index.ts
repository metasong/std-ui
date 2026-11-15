export { computed, signal, type Computed, type Signal, type SignalOptions } from './core/index.js';
export { effect, type OnCleanup } from './effect/index.js';

export {
	toSignal,
	toSignalFrom,
	type ToSignalFromOptions,
	type InteropObservable,
	type PartialObserver,
	type Subscribable,
	type ToSignal,
	type ToSignalOptions,
	type ToSignalSource,
	type Unsubscribable,
} from './to-signal/index.js';

export {
	state,
	type DeepPartial,
	type SignalState,
	type StateDepth,
	changes,
	type WithChanges,
	flags,
	type ValidityFlag,
	type ValidationError,
	type PathError,
	type SignalArray,
	type SignalObject,
	type SignalLeaf,
	type ItemNode,
	type Extendable,
	type Extension,
	type TreeNode,
	childEntries,
	deepEqual,
	extendTree,
	isTreeNode,
} from './state/index.js';

import {
	assertNotInReactiveContext as _assertNotInReactiveContext,
	inReactiveContext as _inReactiveContext,
	untrack as _untrack,
	Watcher as _Watcher,
} from './core/index.js';

/** Grouped re-export of the low-level primitives, named after `Signal.subtle` in the proposed
 * standard signals API (`Signal.subtle.Watcher`, `Signal.subtle.untrack`). Most code should use
 * `state()`/`computed()`/`effect()` instead - reach for `subtle` only when building a custom
 * scheduler or framework integration on top of the dependency graph. */
export const subtle = {
	Watcher: _Watcher,
	untrack: _untrack,
	inReactiveContext: _inReactiveContext,
	assertNotInReactiveContext: _assertNotInReactiveContext,
};
