// Read-only derived value: `computed()`. Lazily recomputes when dependencies change (see
// `./computed-lazy.md`). Uses `./tracking.ts` for dependency tracking.

import { notify, runTracked, track, Watcher, type Dependency } from './tracking.js';
import type { SignalOptions } from './signal.js';

/** A read-only, lazily-recomputed derived value. Call it to read (and track). */
export interface Computed<T> {
	/** Reads the current value and tracks it as a dependency. */
	(): T;
	/** Reads the current value without tracking it as a dependency (still recomputes if dirty). */
	peek(): T;
}

/** Creates a read-only derived value, lazily re-run whenever a signal/computed it reads changes.
 * `options.equals` (default `Object.is`) is checked against the previous value on recompute, same
 * role as `Signal.Computed`'s `equals` option in the proposed standard signals API. */
export function computed<T>(fn: () => T, options: SignalOptions<T> = {}): Computed<T> {
	const { equals = Object.is } = options;
	// cached the computed value to avoid recomputing if not necessary
	let value: T;
	let hasValue = false;
	let dirty = true;
	// who depends on me
	const dep: Dependency = { subscribers: new Set(), isDirty: () => dirty };

	// A computed is both a dependency (others track it) and a consumer (it tracks its own deps,
	// via a `Watcher`). The watcher's `notify` just marks it dirty - the actual recompute happens
	// lazily on next read. Per `Watcher` semantics, it fires (and unsubscribes from every
	// dependency) at most once per dirty window: further changes to *other* deps before the next
	// recompute re-subscribes won't re-notify, so `dirty` only ever flips false -> true once per
	// cycle without needing a manual guard.
	const consumer = new Watcher(() => {
		dirty = true;
		notify(dep);
	});

	const recomputeIfDirty = (): T => {
		if (dirty) {
			const next = runTracked(consumer, fn);
			// `equals` keeps the previously cached reference when the freshly computed value is
			// equivalent, so downstream consumers doing their own reference comparisons (e.g. a
			// parent `computed` with its own `equals`) see no change either.
			if (!hasValue || !equals(next, value)) value = next;
			dirty = false;
			hasValue = true;
		}
		return value;
	};

	const read = (): T => {
		const next = recomputeIfDirty();
		track(dep);
		return next;
	};
	read.peek = recomputeIfDirty;
	return read as Computed<T>;
}
