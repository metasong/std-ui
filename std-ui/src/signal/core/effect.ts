// Side-effect runner: `effect()`. Re-runs are microtask-batched. Built on top of `Watcher` from
// `./tracking.ts` - the low-level primitive modeled on `Signal.subtle.Watcher` in the proposed
// standard signals API.

import { CycleGuard } from '../../dev/effect-cycle-guard.js';
import { runTracked, sourcesChanged, subscribe, unsubscribe, Watcher } from './tracking.js';

/** Call inside an `effect()` body to register cleanup that runs before the next re-run, and on dispose. */
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

function flush(): void {
	flushScheduled = false;
	// Snapshot first: an effect re-running may schedule more effects, which should run next flush.
	const watchers = Array.from(pendingWatchers);
	pendingWatchers.clear();
	for (const watcher of watchers) {
		cycleGuard.count(watcher);
		effectBodies.get(watcher)?.();
	}
	if (pendingWatchers.size === 0) cycleGuard.reset();
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
	let cleanup: (() => void) | undefined;
	let disposed = false;

	const runCleanup = (): void => {
		cleanup?.();
		cleanup = undefined;
	};
	const onCleanup: OnCleanup = (fn: () => void) => {
		cleanup = fn;
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
