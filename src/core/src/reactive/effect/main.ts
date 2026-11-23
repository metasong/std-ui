// Side-effect runner: `effect()`. Re-runs are microtask-batched. Built on top of `Watcher` from
// `../signal/tracking.ts` - the low-level primitive modeled on `Signal.subtle.Watcher` in the proposed
// standard signals API. Not part of the TC39 proposal; lives outside `signal/`.

import { CycleGuard } from './dev/effect-cycle-guard.js';
import { runTracked, sourcesChanged, subscribe, unsubscribe, Watcher } from '../signal/tracking.js';

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

/** Watchers pending a (microtask-batched) re-run. */
const pendingWatchers = new Set<Watcher>();
/** Each watcher's re-run body, looked up by `flush()`. */
const effectBodies = new Map<Watcher, () => void>();
let flushScheduled = false;

function scheduleFlush(): void {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(flush);
}

/** Max re-runs of one effect within a single chain of consecutive flushes before we assume a cycle. */
const MAX_RERUNS_PER_CHAIN = 100;
const cycleGuard = new CycleGuard(MAX_RERUNS_PER_CHAIN, () => pendingWatchers.clear());

/** Resolvers of `whenFlushed()` promises, released once no flush is pending any more. */
let flushWaiters: Array<() => void> = [];

function releaseWaitersIfIdle(): void {
	if (flushScheduled || pendingWatchers.size > 0) return;
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
	if (!flushScheduled && pendingWatchers.size === 0) return Promise.resolve();
	return new Promise(resolve => flushWaiters.push(resolve));
}

function flush(): void {
	flushScheduled = false;
	try {
		// Snapshot first: an effect re-running may schedule more effects, which should run next flush.
		const watchers = Array.from(pendingWatchers);
		pendingWatchers.clear();
		// A throwing effect must not abort the loop: the watchers after it are already out of
		// `pendingWatchers` and inert, so skipping them would leave them dead for good. Run them all,
		// then report what failed.
		const errors: unknown[] = [];
		for (const watcher of watchers) {
			try {
				cycleGuard.count(watcher);
				effectBodies.get(watcher)?.();
			} catch (err) {
				errors.push(err);
			}
		}
		if (pendingWatchers.size === 0) cycleGuard.reset();
		if (errors.length === 1) throw errors[0];
		if (errors.length > 1) throw new AggregateError(errors, `${errors.length} effects threw during one flush`);
	}
	finally {
		// Also when an effect throws: waiters must not hang forever. Re-armed flushes keep them waiting.
		releaseWaitersIfIdle();
	}
}

/**
 * Runs `monitoredAction` immediately, then re-runs it (batched into a microtask) whenever any
 * signal/computed it read changes. Returns a `dispose()` that stops future re-runs and runs any
 * pending cleanup.
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
	// Cleanups registered during the current run. `onCleanup` may be called any number of times; they
	// run in reverse registration order (like a stack / `defer`), so later resources that depend on
	// earlier ones are released first.
	let cleanups: Array<() => void> = [];
	let disposed = false;

	const runCleanup = (): void => {
		const fns = cleanups;
		cleanups = [];
		let failed = false;
		let firstError: unknown;
		for (let i = fns.length - 1; i >= 0; i--) {
			try {
				fns[i]();
			} catch (err) {
				// Keep going so one failing cleanup doesn't leak the rest; rethrow the first at the end.
				if (!failed) {
					failed = true;
					firstError = err;
				}
			}
		}
		if (failed) throw firstError;
	};
	const onCleanup: OnCleanup = (fn: () => void) => {
		cleanups.push(fn);
	};

	// `rerun` does the actual work. Running it through `runTracked(watcher, ...)` re-arms the
	// watcher with whatever deps this run actually read (a `Watcher` goes inert - stops watching -
	// the moment it fires `notify`, per the proposed standard signals API).
	let hasRun = false;
	const rerun = (): void => {
		if (disposed) return;
		// Pull phase: a notification only means "maybe dirty"; skip if nothing read actually changed.
		if (hasRun && !sourcesChanged(watcher)) {
			subscribe(watcher);
			return;
		}
		hasRun = true;

		runCleanup();
		runTracked(watcher, () => monitoredAction(onCleanup));
		afterAction?.();
	};
	// `notify` (called by `watcher.run()` when a watched dependency changes) just schedules `rerun`
	// into the shared microtask flush, so multiple synchronous writes only trigger one re-run.
	const watcher = new Watcher(function notify(this: Watcher): void {
		if (disposed || pendingWatchers.has(this)) return;
		pendingWatchers.add(this);
		scheduleFlush();
	});
	effectBodies.set(watcher, rerun);
	cycleGuard.register(watcher);

	// First run happens synchronously, so initial DOM sync isn't deferred a tick.
	rerun();

	return () => {
		disposed = true;
		pendingWatchers.delete(watcher);
		effectBodies.delete(watcher);
		cycleGuard.unregister(watcher);
		unsubscribe(watcher);
		runCleanup();
	};
}
