// Read-only derived value: `computed()`. Lazily recomputes when dependencies change (see
// `./computed-lazy.md`). Uses `./tracking.ts` for dependency tracking.

import { notify, runTracked, track, type Consumer, type Dependency } from './tracking.js';

/** A read-only, lazily-recomputed derived value. Call it to read (and track). */
export interface Computed<T> {
	(): T;
	/** Reads the current value without tracking it as a dependency (still recomputes if dirty). */
	peek(): T;
}

/** Creates a read-only derived value, lazily re-run whenever a signal/computed it reads changes. */
export function computed<T>(fn: () => T): Computed<T> {
	let value: T;
	let hasValue = false;
	let dirty = true;
	const dep: Dependency = { subscribers: new Set() };

	// A computed is both a dependency (others track it) and a consumer (it tracks its own deps).
	// `run()` just marks it dirty - the actual recompute happens lazily on next read.
	const consumer: Consumer = {
		deps: new Set(),
		run(): void {
			if (dirty) return;
			dirty = true;
			notify(dep);
		}
	};

	const recomputeIfDirty = (): T => {
		if (dirty) {
			value = runTracked(consumer, fn);
			dirty = false;
			hasValue = true;
		}
		return hasValue ? value : (value as T);
	};

	const read = (): T => {
		const next = recomputeIfDirty();
		track(dep);
		return next;
	};
	read.peek = recomputeIfDirty;
	return read as Computed<T>;
}
