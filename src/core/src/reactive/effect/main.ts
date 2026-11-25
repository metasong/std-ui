// Side-effect runner: `effect()`. Re-runs are microtask-batched. Built on `Signal.subtle.Watcher`
// + `Signal.Computed` from `signal-polyfill`. Not part of the TC39 proposal; lives outside `signal/`.

import { CycleGuard } from './dev/effect-cycle-guard.js';
import { Signal } from 'signal-polyfill';
import { untrack, Watcher } from '../signal/tracking.js';

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

/** Effects pending a (microtask-batched) re-run. Swapped (not copied) by `flush()`. */
let pending = new Set<Effect>();
let flushScheduled = false;

function scheduleFlush(): void {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(flush);
}

/** Max re-runs of one effect within a single chain of consecutive flushes before we assume a cycle. */
const MAX_RERUNS_PER_CHAIN = 100;
const cycleGuard = new CycleGuard(MAX_RERUNS_PER_CHAIN, () => pending.clear());

/** Resolvers of `whenFlushed()` promises, released once no flush is pending any more. */
let flushWaiters: Array<() => void> = [];

function releaseWaitersIfIdle(): void {
	if (flushScheduled || pending.size > 0) return;
	const waiters = flushWaiters;
	flushWaiters = [];
	for (const resolve of waiters) resolve();
}

/**
 * Resolves once every effect re-run that is pending *now* - and any re-run those cause in turn
 * (an effect writing a signal another effect reads) - has finished. Resolves immediately when
 * nothing is pending. Unlike counting microtask hops, this holds for cascades of any depth.
 */
export function whenFlushed(): Promise<void> {
	if (!flushScheduled && pending.size === 0) return Promise.resolve();
	return new Promise(resolve => flushWaiters.push(resolve));
}

function flush(): void {
	flushScheduled = false;
	try {
		// Double-buffer: effects scheduled while running land in the fresh set and run next flush.
		const batch = pending;
		pending = new Set();
		// A throwing effect must not abort the loop: the rest are already out of `pending` and inert,
		// so skipping them would leave them dead for good. Run them all, then report what failed.
		let errors: unknown[] | undefined;
		for (const fx of batch) {
			try {
				cycleGuard.count(fx);
				fx.run();
			} catch (err) {
				(errors ??= []).push(err);
			}
		}
		if (pending.size === 0) cycleGuard.reset();
		if (errors) {
			if (errors.length === 1) throw errors[0];
			throw new AggregateError(errors, `${errors.length} effects threw during one flush`);
		}
	}
	finally {
		// Also when an effect throws: waiters must not hang forever. Re-armed flushes keep them waiting.
		releaseWaitersIfIdle();
	}
}

class Effect {
	#cleanups: Array<() => void> | null = null;
	#disposed = false;
	readonly #action: (onCleanup: OnCleanup) => void;
	readonly #after: (() => void) | null;
	readonly #watcher: Watcher;
	// Runs inside a `Signal.Computed`, which tracks reads. A watcher notification only means "maybe
	// dirty": `get()` re-runs this only if a source really changed (equality cutoff), so cleanup +
	// action are skipped on false alarms.
	readonly #body = new Signal.Computed<void>(() => {
		this.#runCleanup();
		this.#action(this.#onCleanup);
	});
	readonly #onCleanup: OnCleanup = fn => {
		(this.#cleanups ??= []).push(fn);
	};

	constructor(action: (onCleanup: OnCleanup) => void, after: (() => void) | null) {
		this.#action = action;
		this.#after = after;
		// `notify` runs synchronously inside the writer's `set()` (reads/writes are forbidden there), so
		// it only schedules into the shared microtask flush: many synchronous writes, one re-run.
		this.#watcher = new Watcher(() => {
			if (this.#disposed || pending.has(this)) return;
			pending.add(this);
			scheduleFlush();
		});
		cycleGuard.register(this);
		this.#watcher.watch(this.#body);
		// First run is synchronous so initial DOM sync isn't deferred a tick.
		this.run();
	}

	run(): void {
		if (this.#disposed) return;
		try {
			this.#body.get();
			this.#after?.();
		} finally {
			// A watcher goes inert after it notifies; re-arm it for the next change.
			this.#watcher.watch();
		}
	}

	dispose = (): void => {
		if (this.#disposed) return;
		this.#disposed = true;
		pending.delete(this);
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
 */
export function effect(
	monitoredAction: (onCleanup: OnCleanup) => void,
	afterAction: (() => void) | null = null
): () => void {
	return new Effect(monitoredAction, afterAction).dispose;
}
