// Shared contract between the tree's container nodes (./array, ./object) and their children.

import { computed, signal, type Computed } from '../core/index.js';
import type { PathError } from './check/index.js';

/** Mixin carried by every tree node: its change-tracking members under `changes`. */
export interface Tracked<T> {
	readonly changes: ChangeTracking<T>;
}

/** Change-tracking members (`dirty`, `reset`), grouped under `node.changes`. */
export interface ChangeTracking<T> {
	/** Tracked; true when the node's current value differs (deeply) from its initial value. */
	readonly dirty: Computed<boolean>;
	/**
	 * Writes the initial value back (members added since are removed, deleted ones re-created). With
	 * `next`, `next` first becomes the new initial value, e.g. `reset(node.peek())` marks the current
	 * value as saved.
	 */
	reset(next?: T): void;
}

/**
 * Minimal node contract needed from each child node (satisfied by `Signal`, arrays, and objects).
 * Only what a parent reads from a child is listed: `valid` and `allErrors` for its own aggregates.
 * `errors` is not needed (it is already part of the child's `allErrors`).
 */
export interface ItemNode<T> {
	(): T;
	peek(): T;
	set(value: any): void;
	/** Present on tree nodes; plain signals have none and count as valid. */
	check?: { allValid: () => boolean; allErrors: () => PathError[]; allPending?: () => boolean };
	changes?: { reset: (next?: any) => void };
}

/**
 * Tracked plain-value read of any signal. Every tree node has `deep()`; this also accepts plain
 * core / standard signals (`signal()`, `computed()`, `toSignal()`), which only have `()`.
 */
export function readValue<T>(node: ItemNode<T>): T {
	const deep = (node as { deep?: () => T }).deep;
	return typeof deep === 'function' ? deep() : node();
}

/** Type of a node built by this module (`state()`, `signalObject()`, `signalArray()`, leaves). */
export interface TreeNode {
	(): unknown;
	peek(): unknown;
	deep(): unknown;
	set(value: any): void;
	readonly changes: unknown;
}

/** Runtime check for `TreeNode`: a function with `deep()` and `changes` (plain core signals have neither). */
export function isTreeNode(value: unknown): value is TreeNode {
	return (
		typeof value === 'function' &&
		typeof (value as { deep?: unknown }).deep === 'function' &&
		(value as { changes?: unknown }).changes !== undefined
	);
}

/**
 * Guards writes into an *existing* member: a node there would be stored as a function (leaf) or
 * have its method names read as keys (object), so it is rejected. A node is adopted only when a
 * member is built (construction, new key, new item).
 */
export function assertNotNode(value: unknown): void {
	if (isTreeNode(value)) {
		throw new TypeError(
			'state: cannot write a state node into an existing member; nodes are adopted at construction or as a new key / item',
		);
	}
}

/** Member nodes of a container node (object members via `_`, array items by index); none for a leaf. */
function childNodes(node: object): unknown[] {
	const members = (node as { _?: object })._;
	if (members) return Object.values(members);
	const out: unknown[] = [];
	for (let i = 0, c; (c = (node as Record<number, unknown>)[i]) !== undefined; i++) out.push(c);
	return out;
}

function reaches(node: unknown, target: object, seen: Set<unknown>): boolean {
	if (node === target) return true;
	if (!isTreeNode(node) || seen.has(node)) return false;
	seen.add(node);
	return childNodes(node).some((c) => reaches(c, target, seen));
}

/**
 * Throws if attaching `child` under `parent` would create a cycle, i.e. `child` is `parent` or
 * already contains it (directly or through adopted nodes). Pass the node a user holds (the proxy).
 */
export function assertAcyclic(parent: object, child: unknown): void {
	if (reaches(child, parent, new Set())) {
		throw new TypeError('state: circular reference detected; a node cannot contain itself');
	}
}


/** Structural equality for plain data: arrays and plain objects recurse, `Date` by time, else `Object.is`. */
export function deepEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (a instanceof Date || b instanceof Date) {
		return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
	}
	if (Array.isArray(a) || Array.isArray(b)) {
		return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
	}
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	return (
		ka.length === kb.length &&
		ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual((a as any)[k], (b as any)[k]))
	);
}

/**
 * Builds the `dirty` / `reset` members for a node. `read` is the tracked plain value, `initial` the
 * first initial value, and `restore` the node's own write-back of an initial value (parents also
 * push it to their children, so every level agrees on the new one).
 */
export function createChangeTracking<T>(
	read: () => T,
	initial: T,
	restore: (initial: T) => void,
): ChangeTracking<T> {
	const current = signal(initial);
	return {
		dirty: computed(() => !deepEqual(read(), current())),
		reset: (...args: [T?]) => {
			if (args.length) current.set(args[0] as T);
			restore(current.peek());
		},
	};
}
