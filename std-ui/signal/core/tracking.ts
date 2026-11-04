// Shared dependency graph for `signal`, `computed`, and `effect`. While a consumer runs, it is
// the global "active consumer"; reads call `track(dep)` so writes can `notify(dep)`.

export interface Consumer {
	/** Dependencies this consumer currently reads (rebuilt every run). */
	deps: Set<Dependency>;
	/** Re-run this consumer in response to a dependency changing. */
	run(): void;
}

export interface Dependency {
	subscribers: Set<Consumer>;
}

/** The consumer currently executing, if any - signal reads during this window get tracked. */
let activeConsumer: Consumer | null = null;

/** Removes `consumer` from every dependency it previously subscribed to. */
export function clearDeps(consumer: Consumer): void {
	for (const dep of consumer.deps) dep.subscribers.delete(consumer);
	consumer.deps.clear();
}

/** Tracks `dep` as a dependency of the currently-running consumer, if any. */
export function track(dep: Dependency): void {
	if (activeConsumer) {
		dep.subscribers.add(activeConsumer);
		activeConsumer.deps.add(dep);
	}
}

/** Notifies `dep`'s subscribers that it changed. */
export function notify(dep: Dependency): void {
	// Snapshot first: a subscriber reacting may mutate `subscribers` (e.g. a computed re-notifying).
	for (const consumer of Array.from(dep.subscribers)) consumer.run();
}

/** Runs `fn` as `consumer`, tracking whatever signals it reads, then restores the prior consumer. */
export function runTracked<T>(consumer: Consumer, fn: () => T): T {
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
