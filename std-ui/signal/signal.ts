// Generic, app-agnostic fine-grained reactivity primitives, Angular-signals-flavored: `signal()`,
// `computed()`, and `effect()`. Safe to lift into any project, same as `../store.ts`.
//
// - `signal(initial)`: a writable value. Call it to read (and auto-track), `.set`/`.update` to write.
// - `computed(fn)`: a read-only value, lazily re-derived when a signal/computed it read changes.
// - `effect(fn)`: re-runs `fn` (batched into a microtask) when a signal/computed it read changes.
//   For side effects (DOM writes, logging); returns a `dispose()`.
//
// Dependency tracking: while a computed/effect body runs, it's the single global "active
// consumer"; any signal read during that window records the consumer as a subscriber.

/** A reactive value: call it to read (and track), call `.set`/`.update` to write. */
export interface Signal<T> {
	(): T;
	set(value: T): void;
	update(fn: (prev: T) => T): T;
	/** Reads the current value without tracking it as a dependency. */
	peek(): T;
}

/** A read-only, lazily-recomputed derived value. Call it to read (and track). */
export interface Computed<T> {
	(): T;
}

/** Call inside an `effect()` body to register cleanup that runs before the next re-run, and on dispose. */
export type OnCleanup = (cleanup: () => void) => void;

interface Consumer {
	/** Dependencies this consumer currently reads (rebuilt every run). */
	deps: Set<Dependency>;
	/** Re-run this consumer in response to a dependency changing. */
	run(): void;
}

interface Dependency {
	subscribers: Set<Consumer>;
}

/** The consumer currently executing, if any - signal reads during this window get tracked. */
let activeConsumer: Consumer | null = null;

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

/** Removes `consumer` from every dependency it previously subscribed to. */
function clearDeps(consumer: Consumer): void {
	for (const dep of consumer.deps) dep.subscribers.delete(consumer);
	consumer.deps.clear();
}

/** Tracks `dep` as a dependency of the currently-running consumer, if any. */
function track(dep: Dependency): void {
	if (activeConsumer) {
		dep.subscribers.add(activeConsumer);
		activeConsumer.deps.add(dep);
	}
}

/** Notifies `dep`'s subscribers that it changed. */
function notify(dep: Dependency): void {
	// Snapshot first: a subscriber reacting may mutate `subscribers` (e.g. a computed re-notifying).
	for (const consumer of Array.from(dep.subscribers)) consumer.run();
}

/** Runs `fn` as `consumer`, tracking whatever signals it reads, then restores the prior consumer. */
function runTracked<T>(consumer: Consumer, fn: () => T): T {
	clearDeps(consumer);
	const prev = activeConsumer;
	activeConsumer = consumer;
	try {
		return fn();
	}
	finally {
		activeConsumer = prev;
	}
}

/** Creates a writable reactive value, seeded with `initial`. */
export function signal<T>(initial: T): Signal<T> {
	let value = initial;
	const dep: Dependency = { subscribers: new Set() };

	const read = (): T => {
		track(dep);
		return value;
	};
	read.set = (next: T): void => {
		if (Object.is(next, value)) return;
		value = next;
		notify(dep);
	};
	/** Updates the signal value by applying `fn` to the **current** value.
	 * Returns the new value.
	*/
	read.update = (fn: (prev: T) => T): T => {
		const next = fn(value);
		read.set(next);
		return next;
	};
	read.peek = (): T => value;
	return read as Signal<T>;
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

	const read = (): T => {
		if (dirty) {
			value = runTracked(consumer, fn);
			dirty = false;
			hasValue = true;
		}
		track(dep);
		return hasValue ? value : (value as T);
	};
	return read as Computed<T>;
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
