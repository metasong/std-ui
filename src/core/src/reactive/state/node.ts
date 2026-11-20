// Shared contract between the tree's container nodes (./array, ./object) and their children.

/**
 * Carried by every tree node: `node.with(feature)` calls `feature(node)` and returns its result, so
 * separate features chain onto a node: `state(0).with(check).with(changes)`. The core knows no feature.
 */
export interface Extendable {
	with<R>(feature: (node: this) => R): R;
}

/** Gives a node its `with()` method. */
export function addWith(node: object): void {
	// `this`, not `node`: object / array nodes are proxies, and a feature must get the one the user holds.
	(node as { with?: unknown }).with = function (this: unknown, feature: (node: unknown) => unknown) {
		return feature(this);
	};
}

/** Hidden slot holding a leaf's `equals` option, for features (`changes`) that compare values. */
export const EQUALS = Symbol('equals');

/**
 * Minimal node contract needed from each child node (satisfied by `Signal`, arrays, and objects).
 * Only what a parent reads from a child is listed. Features (`check`, `changes`) add their own
 * members from outside, so they are not part of this contract.
 */
export interface ItemNode<T> {
	(): T;
	peek(): T;
	set(value: any): void;
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
}

/** Runtime check for `TreeNode`: a function with `deep()` and `shallow()` (plain core signals have neither). */
export function isTreeNode(value: unknown): value is TreeNode {
	return (
		typeof value === 'function' &&
		typeof (value as { deep?: unknown }).deep === 'function' &&
		typeof (value as { shallow?: unknown }).shallow === 'function'
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

/** Untracked `[key, member]` pairs of a container node (object members via `_`, array items by index); none for a leaf. */
export function childEntries(node: object): (readonly [string | number, unknown])[] {
	const members = (node as { _?: object })._;
	if (members) return Object.entries(members);
	const out: (readonly [number, unknown])[] = [];
	for (let i = 0, c; (c = (node as Record<number, unknown>)[i]) !== undefined; i++) out.push([i, c]);
	return out;
}

function childNodes(node: object): unknown[] {
	return childEntries(node).map(([, c]) => c);
}

const EXTENSIONS = Symbol('extensions');

/** A feature added to tree nodes from outside (e.g. `check`): called once per node it reaches. */
export type Extension = (node: object, parent?: object) => void;

function applyExtension(node: unknown, ext: Extension, parent?: object): void {
	if (!isTreeNode(node)) return;
	const list = ((node as { [EXTENSIONS]?: Extension[] })[EXTENSIONS] ??= []);
	if (list.includes(ext)) return; // already extended (shared or revisited node)
	list.push(ext); // remembered, so members this node gets later are extended too
	ext(node, parent); // parent: the container this node was reached through (first one, for a shared node)
	for (const [, child] of childEntries(node)) applyExtension(child, ext, node);
}

/**
 * Applies `ext` to `root` and every descendant now, and to any member `root`'s tree builds later
 * (new keys, pushed items). Idempotent per `(node, ext)`, so a node shared by two trees is extended once.
 */
export function extendTree(root: object, ext: Extension): void {
	applyExtension(root, ext);
}

/** Called by containers when they build a member later: gives it (and its subtree) the parent's extensions. */
export function inheritExtensions(parent: object, child: unknown): void {
	const list = (parent as { [EXTENSIONS]?: Extension[] })[EXTENSIONS];
	if (list) for (const ext of [...list]) applyExtension(child, ext, parent);
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
