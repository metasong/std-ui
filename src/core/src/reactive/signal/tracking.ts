import { DEV } from '../../dev/flag.js';
import { usageError } from '../../util.js';

// Shared dependency graph for `signal`, `computed`, and `effect`. Every one of them is a
// `ReactiveNode`; the whole model is:
//
//   - `sources`:   what I read  -> the `version` I saw when I read it
//   - `observers`: who reads me
//   - `version`:   bumped only when my value really changes
//
// Push: a write calls `notify()`, which tells observers "maybe dirty" (`markDirty()`).
// Pull: before recomputing / re-running, a node calls `sourcesChanged()`; if no source's version
// moved since it was read, the work is skipped (equality cutoff, as in the TC39 proposal).

export class ReactiveNode {
	/** Bumped only when this node's value actually changes (per `equals`). */
	version = 0;
	/** "Maybe stale": a source notified since the last refresh. */
	dirty = false;
	/** What this node read on its last run, with the `version` seen at the time. */
	readonly sources = new Map<ReactiveNode, number>();
	/** Who reads this node. */
	readonly observers = new Set<ReactiveNode>();

	/** A source may have changed. */
	markDirty(): void {}
	/** Brings the value up to date so `version` is current (computed overrides this). */
	refresh(): void {}

	/** Whether this node should be subscribed to its sources right now. Effects/watchers always are;
	 *  a computed overrides this to "only while something observes it", so an abandoned computed
	 *  isn't kept alive (and re-notified) by the long-lived signals it read. */
	isLive(): boolean {
		return true;
	}
	/** The first observer arrived (`observers.size` went 0 -> 1). */
	onWatched(): void {}
	/** The last observer left (`observers.size` went 1 -> 0). */
	onUnwatched(): void {}
}

/** `observer` starts receiving `source`'s notifications; wakes `source` up if it had no observers. */
function link(source: ReactiveNode, observer: ReactiveNode): void {
	if (source.observers.has(observer)) return;
	source.observers.add(observer);
	if (source.observers.size === 1) source.onWatched();
}

/** `observer` stops receiving `source`'s notifications; lets `source` go idle if it was the last one. */
function unlink(source: ReactiveNode, observer: ReactiveNode): void {
	if (source.observers.delete(observer) && source.observers.size === 0) source.onUnwatched();
}

/** The node currently running - reads during this window are tracked as its sources. */
let activeNode: ReactiveNode | null = null;

/** Records `source` as read by the running node. */
export function track(source: ReactiveNode): void {
	if (!activeNode) return;
	activeNode.sources.set(source, source.version);
	// An idle computed records what it read (for `sourcesChanged`) but does not subscribe.
	if (activeNode.isLive()) link(source, activeNode);
}

/** Push phase: tells `source`'s observers they may be stale. */
export function notify(source: ReactiveNode): void {
	// Snapshot: observers reacting may change the set. Skip the running node (self-write guard,
	// otherwise `effect(() => { a(); a.set(...) })` loops forever).
	for (const observer of Array.from(source.observers)) {
		if (observer !== activeNode) observer.markDirty();
	}
}

/** Pull phase: refreshes `node`'s sources in read order; true if any version moved. */
export function sourcesChanged(node: ReactiveNode): boolean {
	for (const [source, seen] of node.sources) {
		source.refresh();
		if (source.version !== seen) return true;
	}
	return false;
}

/** Starts receiving notifications from everything `node` last read. */
export function subscribe(node: ReactiveNode): void {
	for (const source of node.sources.keys()) link(source, node);
}

/** Stops receiving notifications, but keeps `sources` so `sourcesChanged()` still works. */
export function unsubscribe(node: ReactiveNode): void {
	for (const source of node.sources.keys()) unlink(source, node);
}

/** Runs `fn` as `node`, rebuilding its sources from whatever `fn` reads. */
export function runTracked<T>(node: ReactiveNode, fn: () => T): T {
	unsubscribe(node);
	node.sources.clear();
	const prev = activeNode;
	activeNode = node;
	try {
		return fn();
	}
	finally {
		activeNode = prev;
	}
}

/** True while a `computed` or `effect` body is running (or during template render that tracks signals). */
export function inReactiveContext(): boolean {
	return activeNode !== null;
}

/**
 * Throws if called inside a tracked consumer (`computed` / `effect` / render that reads signals).
 * Use from helpers like `toSignal()` that must subscribe exactly once per call site.
 */
export function assertNotInReactiveContext(
	caller: string,
	message?: string,
): void {
	if (inReactiveContext()) {
		throw usageError(message ?? (DEV && `${caller} must not run while a computed, effect, or template is tracking dependencies — each call creates a new subscription. Create the signal once (field, \`connect()\`, or module scope), then read it inside reactive code.`), caller);
	}
}

/** Runs `fn` with no active node, so any signal/computed it reads is NOT tracked - even if
 * called from inside a `computed`/`effect`. Equivalent to `Signal.subtle.untrack()` in the
 * proposed standard signals API. (`.peek()` is the single-read sibling of this.) */
export function untrack<T>(fn: () => T): T {
	const prev = activeNode;
	activeNode = null;
	try {
		return fn();
	}
	finally {
		activeNode = prev;
	}
}

/**
 * Low-level primitive modeled on `Signal.subtle.Watcher` from the proposed standard signals API:
 * fires `notify` (synchronously, at most once) the moment any watched node may have changed, then
 * goes inert until re-armed by `watch()` / `subscribe()` / `runTracked()`. `effect()` in `../effect/`
 * is built on top of this.
 */
export class Watcher extends ReactiveNode {
	constructor(private readonly notify: (this: Watcher) => void) {
		super();
	}

	/** Starts watching `nodes`, in addition to any already watched. */
	watch(...nodes: ReactiveNode[]): void {
		for (const node of nodes) {
			this.sources.set(node, node.version);
			link(node, this);
		}
	}
	/** Stops watching `nodes`. */
	unwatch(...nodes: ReactiveNode[]): void {
		for (const node of nodes) {
			this.sources.delete(node);
			unlink(node, this);
		}
	}
	/** The watched nodes that are currently dirty (notified but not yet recomputed). */
	getPending(): ReactiveNode[] {
		return Array.from(this.sources.keys()).filter(node => node.dirty);
	}
	override markDirty(): void {
		unsubscribe(this); // inert until re-armed
		this.notify.call(this);
	}
}
