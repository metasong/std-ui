// Read-only derived value: `computed()`. Lazily recomputes when dependencies change. A
// `Signal.Computed` from `signal-polyfill` plus `peek()`.

import { Signal } from 'signal-polyfill';
import { untrack } from './tracking.js';
import type { ReadableState, StateOptions } from './state.js';

/** A read-only, lazily-recomputed derived value. `.get()` reads (and tracks). A standard `Signal.Computed`. */
export class Computed<T> extends Signal.Computed<T> implements ReadableState<T> {
	constructor(fn: () => T, options: StateOptions<T> = {}) {
		super(fn, options as Signal.Options<T>);
	}
	/** Reads the current value without tracking it as a dependency. */
	peek(): T {
		return untrack(() => this.get());
	}
}

/** Creates a read-only derived value, lazily re-run whenever a signal/computed it reads changes.
 * `options.equals` (default `Object.is`) is checked against the previous value on recompute, same
 * role as `Signal.Computed`'s `equals` option in the proposed standard signals API. */
export function computed<T>(fn: () => T, options: StateOptions<T> = {}): Computed<T> {
	return new Computed<T>(fn, options);
}
