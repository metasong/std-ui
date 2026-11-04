// Side-effect runner: `effect()`. Re-runs are microtask-batched. Uses `./tracking.ts`.

import { clearDeps, runTracked, type Consumer } from './tracking.js';

/** Call inside an `effect()` body to register cleanup that runs before the next re-run, and on dispose. */
export type OnCleanup = (cleanup: () => void) => void;

/** Effects pending a (microtask-batched) re-run. */
const pendingEffects = new Set<Consumer>();
/** Each effect consumer's re-run body, looked up by `flush()`. */
const effectBodies = new Map<Consumer, () => void>();
let flushScheduled = false;

function scheduleFlush(): void {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(flush);
}

function flush(): void {
	flushScheduled = false;
	// Snapshot first: an effect re-running may schedule more effects, which should run next flush.
	const effects = Array.from(pendingEffects);
	pendingEffects.clear();
	for (const consumer of effects) effectBodies.get(consumer)?.();
}

/**
 * Runs `fn` immediately, then re-runs it (batched into a microtask) whenever any signal/computed
 * it read changes. Returns a `dispose()` that stops future re-runs and runs any pending cleanup.
 */
export function effect(fn: (onCleanup: OnCleanup) => void): () => void {
	let cleanup: (() => void) | undefined;
	let disposed = false;

	const runCleanup = (): void => {
		cleanup?.();
		cleanup = undefined;
	};
	const onCleanup: OnCleanup = (fn: () => void) => {
		cleanup = fn;
	};

	// `rerun` does the actual work; `consumer.run` (called by dependencies on change) just
	// schedules `rerun` into the shared microtask flush, so multiple synchronous writes only
	// trigger one re-run.
	const rerun = (): void => {
		if (disposed) return;
		runCleanup();
		runTracked(consumer, () => fn(onCleanup));
	};
	const consumer: Consumer = {
		deps: new Set(),
		run(): void {
			if (disposed || pendingEffects.has(consumer)) return;
			pendingEffects.add(consumer);
			scheduleFlush();
		}
	};
	effectBodies.set(consumer, rerun);

	// First run happens synchronously, so initial DOM sync isn't deferred a tick.
	rerun();

	return () => {
		disposed = true;
		pendingEffects.delete(consumer);
		effectBodies.delete(consumer);
		clearDeps(consumer);
		runCleanup();
	};
}
