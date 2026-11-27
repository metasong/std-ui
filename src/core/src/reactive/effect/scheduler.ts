// The shared microtask flush behind `effect()` and `watchSignal()`: a queue of jobs, the cycle guard, and
// `whenFlushed()`. A job is anything with `run()`; it enqueues itself when its `Watcher` is notified.

import { CycleGuard } from './dev/effect-cycle-guard.js';

/** Something the flush can re-run: an `Effect`, or a `SignalWatch`. */
export interface Job {
	run(): void;
}

/** Jobs pending a (microtask-batched) re-run. Swapped (not copied) by `flush()`. */
let pending = new Set<Job>();
let flushScheduled = false;

/** Max re-runs of one job within a single chain of consecutive flushes before we assume a cycle. */
const MAX_RERUNS_PER_CHAIN = 100;

/** Shared by every job: counts re-runs per chain, and (dev) remembers where each job came from. */
export const cycleGuard = new CycleGuard(MAX_RERUNS_PER_CHAIN, () => pending.clear());

/** Queues `job` for the next flush (once, however many writes notified it). Call from a `Watcher` notify callback. */
export function enqueue(job: Job): void {
	if (pending.has(job)) return;
	pending.add(job);
	scheduleFlush();
}

/** Drops `job` from the queue, e.g. when it is disposed. */
export function dequeue(job: Job): void {
	pending.delete(job);
}

function scheduleFlush(): void {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(flush);
}

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
		// Double-buffer: jobs scheduled while running land in the fresh set and run next flush.
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
