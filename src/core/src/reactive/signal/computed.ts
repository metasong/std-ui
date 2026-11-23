// Read-only derived value: `computed()`. Lazily recomputes when dependencies change (see
// `./computed-lazy.md`). Uses `./tracking.ts` for dependency tracking.

import { DEV } from '../../dev/flag.js';
import { notify, ReactiveNode, runTracked, sourcesChanged, subscribe, track, unsubscribe } from './tracking.js';
import type { ReadonlyState, StateOptions } from './state.js';

/** A read-only, lazily-recomputed derived value. Call it to read (and track). */
export type Computed<T> = ReadonlyState<T>;

/** Creates a read-only derived value, lazily re-run whenever a signal/computed it reads changes.
 * `options.equals` (default `Object.is`) is checked against the previous value on recompute, same
 * role as `Signal.Computed`'s `equals` option in the proposed standard signals API. */
export function computed<T>(fn: () => T, options: StateOptions<T> = {}): Computed<T> {
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
	// Subscribed to its sources only while something observes it. An unobserved computed gets no
	// notifications, so it can't trust `dirty` and re-verifies its sources on every read instead.
	node.isLive = () => node.observers.size > 0;
	node.onWatched = () => {
		subscribe(node);
		// Nothing told us about changes while idle: re-verify now, so `dirty === false` is trustworthy again.
		node.dirty = true;
		node.refresh();
	};
	node.onUnwatched = () => {
		unsubscribe(node); // keeps `sources` for the version checks on the next read
		node.dirty = true;
	};
	let computing = false;
	node.refresh = () => {
		if (!node.dirty && node.observers.size > 0) return;
		// Re-entered while our own `fn` is still running => `fn` (directly or via other computeds) reads itself.
		if (computing) {
			throw new Error(
				DEV
					? 'std-ui computed: circular dependency detected - a computed read itself while being computed.'
					: 'std-ui: circular computed',
			);
		}
		computing = true;
		try {
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
		}
		finally {
			computing = false; // also on throw, so the computed isn't stuck "computing" forever
		}
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
