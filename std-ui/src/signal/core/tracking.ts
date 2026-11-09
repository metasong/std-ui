// Shared dependency graph for `signal`, `computed`, and `effect`. While a watcher runs, it is
// the global "active watcher"; reads call `track(dep)` so writes can `notify(dep)`.

export interface IWatcher {
	/** Dependencies this watcher currently reads (rebuilt every run). */
	deps: Set<Dependency>;
	/** Re-run this watcher in response to a dependency changing. */
	run(): void;
}

export interface Dependency {
	/** who depends on me? */
	subscribers: Set<IWatcher>;
	/** is me dirty?
	 * Optional (set by `computed`): reports whether this dependency's value is stale and hasn't
	 * been recomputed since it was last marked dirty. Lets a `Watcher` answer `getPending()`
	 * without forcing a recompute, mirroring `Signal.subtle.Watcher.getPending()`. */
	isDirty?(): boolean;
}

/** global variable, the watcher currently executing, if any - signal reads during this window get tracked. */
let activeWatcher: IWatcher | null = null;

/** Break the 2-way link between a watcher and its dependencies */
export function clearDeps(watcher: IWatcher): void {
	for (const dep of watcher.deps) dep.subscribers.delete(watcher);
	watcher.deps.clear();
}

/** Setup the 2-way link between the dependency and  the active watcher. */
export function track(dep: Dependency): void {
	if (activeWatcher) {
		dep.subscribers.add(activeWatcher);
		activeWatcher.deps.add(dep);
	}
}

/** Notifies `dep`'s subscribers that it changed. */
export function notify(dep: Dependency): void {
	// Snapshot first: a subscriber reacting may mutate `subscribers` (e.g. a computed re-notifying).
	for (const watcher of Array.from(dep.subscribers))
		watcher.run(); // may trigger subscribers modification
}

/** Runs `fn` as `watcher`, tracking whatever signals it reads, then restores the prior watcher. */
export function runTracked<T>(watcher: IWatcher, fn: () => T): T {
	// clear for re-setup the watcher's dependencies after running the function
	clearDeps(watcher);
	const prev = activeWatcher;
	activeWatcher = watcher;
	try {
		return fn();
	}
	finally {
		activeWatcher = prev;
	}
}

/** True while a `computed` or `effect` body is running (or during template render that tracks signals). */
export function inReactiveContext(): boolean {
	return activeWatcher !== null;
}

/**
 * Throws if called inside a tracked consumer (`computed` / `effect` / render that reads signals).
 * Use from helpers like `toSignal()` that must subscribe exactly once per call site.
 */
export function assertNotInReactiveContext(
	caller: string,
	message = `${caller} must not run while a computed, effect, or template is tracking dependencies — each call creates a new subscription. Create the signal once (field, \`connect()\`, or module scope), then read it inside reactive code.`,
): void {
	if (inReactiveContext()) throw new Error(message);
}

/** Runs `fn` with no active watcher, so any signal/computed it reads is NOT tracked - even if
 * called from inside a `computed`/`effect`. Equivalent to `Signal.subtle.untrack()` in the
 * proposed standard signals API. (`.peek()` is the single-read sibling of this.) */
export function untrack<T>(fn: () => T): T {
	const prev = activeWatcher;
	activeWatcher = null;
	try {
		return fn();
	}
	finally {
		activeWatcher = prev;
	}
}

/**
 * Low-level primitive modeled on `Signal.subtle.Watcher` from the proposed standard signals API:
 * watches a fixed set of dependencies and fires `notify` (synchronously, at most once) the moment
 * any of them changes - then goes inert. Re-arm by calling `watch()` again (typically with
 * whatever deps the next run actually reads). `effect()` is built on top of this: `notify`
 * schedules a microtask-batched re-run, and the re-run re-arms the watcher via `runTracked`.
 */
export class Watcher implements IWatcher {
	/** Currently watched dependencies - doubles as this `IWatcher`'s tracked-deps set. */
	readonly deps = new Set<Dependency>();
	constructor(private readonly notify: (this: Watcher) => void) {}

	/** Starts watching `deps`, in addition to any already watched. */
	watch(...deps: Dependency[]): void {
		for (const dep of deps) {
			this.deps.add(dep);
			dep.subscribers.add(this);
		}
	}
	/** Stops watching `deps`. */
	unwatch(...deps: Dependency[]): void {
		for (const dep of deps) {
			this.deps.delete(dep);
			dep.subscribers.delete(this);
		}
	}
	/** The watched dependencies that are currently dirty (changed but not yet recomputed/read). */
	getPending(): Dependency[] {
		return Array.from(this.deps).filter(dep => dep.isDirty?.() ?? false);
	}
	/** Called by a watched dependency's `notify()`. Per spec, fires once then goes inert - clears
	 * all subscriptions so `getPending()`/further changes are silent until re-`watch()`ed. */
	run(): void {
		// Self-write guard: a write to a dependency while this watcher is the one running must not
		// re-trigger it (otherwise `effect(() => { a(); a.set(...) })` loops forever).
		if (activeWatcher === this) return;
		// break the 2-way link between the watcher and its dependencies,
		// so no further notifications are sent to this watcher from the dependencies.
		clearDeps(this);
		this.notify.call(this);
	}
}
