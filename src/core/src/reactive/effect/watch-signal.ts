// `watchSignal()`: the one-signal case of `effect()`, without a computed body on top of the signal.
// Runs in the same microtask flush as effects (see `./scheduler.ts`). Used by `SignalBinding`.

import { Signal } from 'signal-polyfill';
import { untrack, Watcher } from '../signal/tracking.js';
import { cycleGuard, dequeue, enqueue, type Job } from './scheduler.js';

/** A `State` or `Computed` made by this library or the polyfill: the only sources a `Watcher` can watch directly. */
export type WatchableSignal = Signal.State<unknown> | Signal.Computed<unknown>;

/** Whether `value` can be given to `watchSignal()`. */
export function isWatchableSignal(value: unknown): value is WatchableSignal & { peek(): unknown } {
	return (value instanceof Signal.State || value instanceof Signal.Computed) && typeof (value as { peek?: unknown }).peek === 'function';
}

/**
 * The one-signal case of `effect()`: a `Watcher` straight on `source`, no tracked body in between. Cheaper
 * than `effect(() => onValue(source.get()))`, which puts a `Signal.Computed` (and its closures) on top of the
 * signal just to track one read.
 *
 * Calls `onValue(value)` now, then after a change in the same microtask-batched flush as effects, so ordering,
 * `whenFlushed()` and the cycle guard behave the same. `onValue` is untracked. Returns a `dispose()`.
 *
 * Cutoff: a `State` only notifies when its own `equals` says the value changed, so every notification is a
 * real change and `onValue` always runs (also for an in-place mutation re-set with `equals: () => false`).
 * A `Computed` is notified as soon as a source *may* have changed, before it recomputes, so a re-run is
 * skipped when the recomputed value is equal to the last one handed over, by the computed's own `equals`
 * option (exposed by our `Computed`; `Object.is` when it has none).
 */
export function watchSignal<T>(source: WatchableSignal & { peek(): T }, onValue: (value: T) => void, name?: string): () => void {
	return new SignalWatch(source, onValue as (value: unknown) => void, name).dispose;
}

class SignalWatch implements Job {
	#disposed = false;
	#started = false;
	/** The last value handed over; kept only for a `Computed` source (see `watchSignal`), so a `State`'s value is not retained. */
	#last: unknown;
	/** Whether a notification can be a false alarm (a `Computed`), so `run()` must compare with `#last`. */
	readonly #cutoff: boolean;
	readonly #source: WatchableSignal & { peek(): unknown };
	readonly #onValue: (value: unknown) => void;
	readonly #watcher: Watcher;

	constructor(source: WatchableSignal & { peek(): unknown }, onValue: (value: unknown) => void, name: string | undefined) {
		this.#source = source;
		this.#onValue = onValue;
		this.#cutoff = !(source instanceof Signal.State);
		// Same rule as `Effect`: `notify` only schedules into the shared flush.
		this.#watcher = new Watcher(() => {
			if (!this.#disposed) enqueue(this);
		});
		cycleGuard.register(this, onValue, name, source, true);
		this.#watcher.watch(source);
		// First run is synchronous, like an effect's.
		this.run();
	}

	run(): void {
		if (this.#disposed) return;
		try {
			// `peek()`: untracked, so a part created inside the host's template effect does not make it depend on `source`.
			const value = this.#source.peek();
			if (this.#cutoff) {
				if (this.#started && this.#same(this.#last, value)) return;
				this.#started = true;
				this.#last = value;
			}
			untrack(() => this.#onValue(value));
		} finally {
			// A watcher goes inert after it notifies; re-arm it for the next change.
			this.#watcher.watch();
		}
	}

	/** The computed's own cutoff: its `equals` option (exposed by our `Computed`), else `Object.is`. */
	#same(prev: unknown, next: unknown): boolean {
		const equals = (this.#source as { equals?: (this: unknown, a: unknown, b: unknown) => boolean }).equals;
		return equals ? equals.call(this.#source, prev, next) : Object.is(prev, next);
	}

	dispose = (): void => {
		if (this.#disposed) return;
		this.#disposed = true;
		dequeue(this);
		cycleGuard.unregister(this);
		this.#watcher.unwatch(this.#source);
		this.#last = undefined;
	};
}
