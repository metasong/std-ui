// Writable reactive value: `state()`. See `./computed.ts` for derived values; `../effect/` for
// side effects; `./tracking.ts` for the polyfill glue. `State` is a `Signal.State` from
// `signal-polyfill` (so it works with any standard signal consumer) plus `peek()` and `update()`.

import { Signal } from 'signal-polyfill';
import { untrack } from './tracking.js';

/** Options accepted by `state()` and `computed()`; a subset of the polyfill's `Signal.Options`.
 * Declared with method syntax (not a function-typed property) so `equals` stays bivariant, which
 * lets callers pass a narrower comparator such as `(a: Item, b: Item) => ...`. */
export interface StateOptions<T> {
	/** Decides whether a new value counts as a change (and should notify subscribers).
	 * Defaults to `Object.is`. */
	equals?(prev: T, next: T): boolean;
}

/** The read side of a signal: what a consumer may do. Expose a private `State` under this type to hand out read-only access. */
export interface ReadableState<T = unknown> {
	/** Reads the current value and tracks it as a dependency. */
	get(): T;
	/** Reads the current value without tracking it as a dependency.*/
	peek(): T;
}

/** A signal that can be read, peeked and written: a `state()` or a `stateTree()` node. The one shape
 * bind, `@attribute`, `@provide` and `defineContext` accept as a store. `set` takes `never` so a
 * node whose `set` accepts a narrower or wider value (a tree branch takes a partial) still fits. */
export interface WritableState<T = unknown> extends ReadableState<T> {
	set(value: never): void;
}

/** Whether `value` is a `WritableState`: it has `get()`, `peek()` and `set()`. Structural, not
 * `instanceof State`, because a `stateTree()` node is not a `State`. `peek` tells it apart from a
 * plain `{ get, set }` accessor and from a foreign `Signal.State`. Shared by bind, property parts and
 * attributes. */
export function isWritableState(value: unknown): value is WritableState {
	return isReadableState(value) && typeof (value as { set?: unknown }).set === 'function';
}

/** Whether `value` is a `ReadableState`: it has `get()` and `peek()` (a `state()`, a `computed()`
 * or a `stateTree()` node). Use it where a value is only read; use `isWritableState` where it is written. */
export function isReadableState(value: unknown): value is ReadableState {
	const v = value as { get?: unknown; peek?: unknown } | null | undefined;
	return typeof v?.get === 'function' && typeof v.peek === 'function';
}

/** A reactive value: `.get()` reads (and tracks), `.set` / `.update` write. A standard `Signal.State`. */
export class State<T> extends Signal.State<T> implements WritableState<T> {
	constructor(initial: T, options: StateOptions<T> = {}) {
		super(initial, options as Signal.Options<T>);
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

/** Whether `value` is a `state()` made by this library. A foreign `Signal.State` (no `peek` /
 * `update`) is deliberately not one. */
export const isState = (value: unknown): value is State<unknown> => value instanceof State;

/** Creates a writable reactive value, seeded with `initial`. */
export function state<T>(initial: T, options: StateOptions<T> = {}): State<T> {
	return new State<T>(initial, options);
}
