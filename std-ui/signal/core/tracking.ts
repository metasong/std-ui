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

/** global variable, the consumer currently executing, if any - signal reads during this window get tracked. */
let activeConsumer: Consumer | null = null;

/** Break the 2-way link between a consumer and its dependencies */
export function clearDeps(consumer: Consumer): void {
	for (const dep of consumer.deps) dep.subscribers.delete(consumer);
	consumer.deps.clear();
}

/** Setup the 2-way link between the dependency and  the active consumer. */
export function track(dep: Dependency): void {
	if (activeConsumer) {
		dep.subscribers.add(activeConsumer);
		activeConsumer.deps.add(dep);
	}
}

/** Notifies `dep`'s subscribers that it changed. */
export function notify(dep: Dependency): void {
	// Snapshot first: a subscriber reacting may mutate `subscribers` (e.g. a computed re-notifying).
	for (const consumer of Array.from(dep.subscribers))
		consumer.run(); // may trigger subscribers modification
}

/** Runs `fn` as `consumer`, tracking whatever signals it reads, then restores the prior consumer. */
export function runTracked<T>(consumer: Consumer, fn: () => T): T {
	// clear for re-setup the consumer's dependencies after running the function
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
