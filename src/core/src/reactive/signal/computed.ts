// Read-only derived value: `computed()`. Lazily recomputes when dependencies change (see
// `./computed-lazy.md`). Uses `./tracking.ts` for dependency tracking.

import { notify, ReactiveNode, runTracked, sourcesChanged, track } from './tracking.js';
import type { ReadonlySignal, SignalOptions } from './signal.js';

/** A read-only, lazily-recomputed derived value. Call it to read (and track). */
export type Computed<T> = ReadonlySignal<T>;

/** Creates a read-only derived value, lazily re-run whenever a signal/computed it reads changes.
 * `options.equals` (default `Object.is`) is checked against the previous value on recompute, same
 * role as `Signal.Computed`'s `equals` option in the proposed standard signals API. */
export function computed<T>(fn: () => T, options: SignalOptions<T> = {}): Computed<T> {
	const { equals = Object.is } = options;
	let value: T;
	let hasValue = false;
	const node = new ReactiveNode();
	node.dirty = true;

	// Only propagate on the clean -> dirty edge; the recompute itself waits for the next read.
	node.markDirty = () => {
		if (node.dirty) return;
		node.dirty = true;
		notify(node);
	};
	node.refresh = () => {
		if (!node.dirty) return;
		// "Maybe dirty" is confirmed only if a source's version actually moved.
		if (!hasValue || sourcesChanged(node)) {
			const next = runTracked(node, fn);
			// An equal result keeps the old reference and `version`, so observers skip too.
			if (!hasValue || !equals(next, value)) {
				value = next;
				node.version++;
			}
			hasValue = true;
		}
		node.dirty = false;
	};

	const read = (): T => {
		node.refresh();
		track(node);
		return value;
	};
	read.peek = (): T => {
		node.refresh();
		return value;
	};
	return read as Computed<T>;
}
