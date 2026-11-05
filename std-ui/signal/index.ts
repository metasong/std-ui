export {
	computed,
	effect,
	signal,
	untrack,
	Watcher,
	type Computed,
	type Dependency,
	type OnCleanup,
	type Signal,
	type SignalOptions,
} from './core/index.js';

export {
	buildSignalTree,
	type DeepPartial,
	type SignalTree,
} from './tree.js';

import { untrack as _untrack, Watcher as _Watcher } from './core/index.js';

/** Grouped re-export of the low-level primitives, named after `Signal.subtle` in the proposed
 * standard signals API (`Signal.subtle.Watcher`, `Signal.subtle.untrack`). Most code should use
 * `signal()`/`computed()`/`effect()` instead - reach for `subtle` only when building a custom
 * scheduler or framework integration on top of the dependency graph. */
export const subtle = {
	Watcher: _Watcher,
	untrack: _untrack,
};
