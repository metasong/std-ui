// Side-effect runner: `effect()`. Re-runs are microtask-batched (see `./scheduler.ts`). Built on
// `Signal.subtle.Watcher` + `Signal.Computed` from `signal-polyfill`. Not part of the TC39 proposal.

import { Signal } from 'signal-polyfill';
import { untrack, Watcher } from '../signal/tracking.js';
import { cycleGuard, dequeue, enqueue, type Job } from './scheduler.js';

/**
 * Call inside an `effect()` body to register cleanup that runs before the next re-run, and on dispose.
 *
 * Design notes:
 * - Registration (not a returned function, not a 2nd `effect` argument) so the cleanup closes over
 *   locals created in the run (e.g. a timer id) and can be registered conditionally.
 * - May be called multiple times per run; every cleanup is kept (nothing is overwritten).
 * - Cleanups run in reverse order (LIFO), so resources are released opposite to acquisition.
 * - If a cleanup throws, the remaining ones still run; the first error is rethrown afterwards.
 * - Cleanups registered in a run apply only to that run; the list resets before each re-run.
 */
export type OnCleanup = (cleanup: () => void) => void;

class Effect implements Job {
	#cleanups: Array<() => void> | null = null;
	#disposed = false;
	readonly #action: (onCleanup: OnCleanup) => void;
	readonly #after: (() => void) | null;
	readonly #watcher: Watcher;
	// Runs inside a `Signal.Computed`, which tracks reads. A watcher notification only means "maybe
	// dirty": `get()` re-runs this only if a source really changed (equality cutoff), so cleanup +
	// action are skipped on false alarms.
	#ran = false;
	readonly #body = new Signal.Computed<void>(() => {
		this.#ran = true;
		this.#runCleanup();
		this.#action(this.#onCleanup);
	});
	readonly #onCleanup: OnCleanup = fn => {
		(this.#cleanups ??= []).push(fn);
	};

	constructor(action: (onCleanup: OnCleanup) => void, after: (() => void) | null, name: string | undefined) {
		this.#action = action;
		this.#after = after;
		// `notify` runs synchronously inside the writer's `set()` (reads/writes are forbidden there), so
		// it only schedules into the shared microtask flush: many synchronous writes, one re-run.
		this.#watcher = new Watcher(() => {
			if (!this.#disposed) enqueue(this);
		});
		cycleGuard.register(this, action, name, this.#body as Signal.Computed<unknown>);
		this.#watcher.watch(this.#body);
		// First run is synchronous so initial DOM sync isn't deferred a tick.
		this.run();
	}

	run(): void {
		if (this.#disposed) return;
		try {
			this.#body.get();
			// `afterAction` pairs with `monitoredAction`: skip it when the body was not re-run (false alarm).
			if (this.#ran) {
				this.#ran = false;
				this.#after?.();
			}
		} finally {
			// A watcher goes inert after it notifies; re-arm it for the next change.
			this.#watcher.watch();
		}
	}

	dispose = (): void => {
		if (this.#disposed) return;
		this.#disposed = true;
		dequeue(this);
		cycleGuard.unregister(this);
		this.#watcher.unwatch(this.#body);
		this.#runCleanup();
	};

	/** Runs cleanups LIFO, untracked; every one runs, the first error is rethrown afterwards. */
	#runCleanup(): void {
		const fns = this.#cleanups;
		if (!fns) return;
		this.#cleanups = null;
		untrack(() => {
			let failed = false;
			let firstError: unknown;
			for (let i = fns.length - 1; i >= 0; i--) {
				try {
					fns[i]();
				} catch (err) {
					if (!failed) { failed = true; firstError = err; }
				}
			}
			if (failed) throw firstError;
		});
	}
}

/**
 * Runs `monitoredAction` immediately, then re-runs it (batched into a microtask) whenever any
 * signal/computed it read changes. Returns a `dispose()` that stops future re-runs and runs any
 * pending cleanup.
 *
 * The effect is referenced by every signal it read (and holds its closure), so it is never garbage-collected
 * on its own: call `dispose()` when the owner goes away. `UIElement` does this for its own effects on disconnect.
 *
 * @param monitoredAction - The tracked effect body, run initially and on every re-run. Receives
 * `onCleanup` to register cleanup that runs before the next re-run and on dispose.
 * @param afterAction - Optional callback run right after `monitoredAction` on every run (initial
 * and re-runs). Not dependency-tracked, so signals it reads won't trigger re-runs. Defaults to
 * `null`.
 * @param options - `name` labels the effect in cycle errors and, in dev, replaces the creation stack
 * (`new Error()`, about 7us per effect, against about 1.6us without). Use it for effects made by library
 * internals, where a stack would only point inside the library, or in code creating many effects.
 */
export function effect(
	monitoredAction: (onCleanup: OnCleanup) => void,
	afterAction: (() => void) | null = null,
	options: { name?: string } = {},
): () => void {
	return new Effect(monitoredAction, afterAction, options.name).dispose;
}
