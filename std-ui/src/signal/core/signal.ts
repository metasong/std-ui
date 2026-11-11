// Writable reactive value: `signal()`. See `./computed.ts` for derived values; `../effect/` for
// side effects; `./tracking.ts` for the shared dependency graph.

import { notify, ReactiveNode, track } from './tracking.js';

/** Options accepted by `signal()`, named after `Signal.State`'s options in the proposed standard
 * signals API. */
export interface SignalOptions<T> {
	/** Decides whether a `.set()`/`.update()` value counts as a change (and should notify
	 * subscribers). Defaults to `Object.is`, same as the proposal's default. */
	equals?(a: T, b: T): boolean;
}

/** A reactive value: call it to read (and track), call `.set`/`.update` to write. */
export interface Signal<T> {
	/** Reads the current value and tracks it as a dependency. */
	(): T;
	/** Reads the current value without tracking it as a dependency.*/
	peek(): T;
	set(value: T): void;
	update(fn: (prev: T) => T): T;
}

/** Creates a writable reactive value, seeded with `initial`. */
export function signal<T>(initial: T, options: SignalOptions<T> = {}): Signal<T> {
	const { equals = Object.is } = options;
	let value = initial;
	const node = new ReactiveNode();

	const read = (): T => {
		track(node);
		return value;
	};
	read.set = (next: T): void => {
		if (equals(next, value)) return;
		value = next;
		node.version++;
		notify(node);
	};
	/** Updates the signal value by applying `fn` to the **current** value.
	 * Returns the new value.
	*/
	read.update = (fn: (prev: T) => T): T => {
		const next = fn(value);
		read.set(next);
		return next;
	};
	read.peek = (): T => value;
	return read as Signal<T>;
}
