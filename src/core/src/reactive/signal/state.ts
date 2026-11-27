// Writable reactive value: `state()`. See `./computed.ts` for derived values; `../effect/` for
// side effects; `./tracking.ts` for the polyfill glue. `State` is a `Signal.State` from
// `signal-polyfill` (so it works with any standard signal consumer) plus `peek()` and `update()`.

import { Signal } from 'signal-polyfill';
import { DEV } from '../../dev/flag.js';
import { once } from '../../dev/once.js';
import type { WritableSignal } from './signal-type.js';
import { untrack } from './tracking.js';

/** Options accepted by `state()` and `computed()`; extends the polyfill's `Signal.Options`.
 * `equals` is redeclared with method syntax (not a function-typed property) so it stays bivariant, which
 * lets callers pass a narrower comparator such as `(a: Item, b: Item) => ...`. */
export interface SignalOptions<T> extends Signal.Options<T> {
	/** Decides whether a new value counts as a change (and should notify subscribers).
	 * Defaults to `Object.is`. */
	equals?(prev: T, next: T): boolean;
}

/** A reactive value: `.get()` reads (and tracks), `.set` / `.update` write. A standard `Signal.State`. */
export class State<T> extends Signal.State<T> implements WritableSignal<T> {
	constructor(initial: T, options: SignalOptions<T> = {}) {
		super(initial, options);
	}
	/** Reads the current value without tracking it as a dependency. */
	peek(): T {
		return untrack(() => this.get());
	}
	/** Updates the signal value by applying `fn` to the **current** value.
	 * Returns the new value.
	*/
	update(fn: (prev: T) => T): T {
		const next = fn(this.peek());
		this.set(next);
		return next;
	}
}

// DEV only: writing a signal that the running computed/effect body has already read leaves that
// body stale (the polyfill marks it clean after its own write; nothing re-runs it, nothing throws).
// Installed only in DEV so production keeps the polyfill's `set` untouched. Not detected when the
// write is wrapped in `untrack()` (no active computed then). See `../effect/effect-pitfalls.md`.
if (DEV) {
	const baseSet = Signal.State.prototype.set;
	State.prototype.set = function (this: State<unknown>, value: unknown): void {
		const running = Signal.subtle.currentComputed();
		if (running && Signal.subtle.introspectSources(running).includes(this)) {
			once(
				'write-read-signal-in-computed',
				'std-ui: a computed/effect wrote a signal it has already read; this update is not seen by that computed/effect and it will not re-run. Read with peek(), or do the write in effect() afterAction. See reactive/effect/effect-pitfalls.md.',
			);
		}
		baseSet.call(this, value);
	};
}

/** Whether `value` is a `state()` made by this library. A foreign `Signal.State` (no `peek` /
 * `update`) is deliberately not one. */
export const isState = (value: unknown): value is State<unknown> => value instanceof State;

/** Creates a writable reactive value, seeded with `initial`. */
export function state<T>(initial: T, options: SignalOptions<T> = {}): State<T> {
	return new State<T>(initial, options);
}
