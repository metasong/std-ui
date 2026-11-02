// Builds a tree of signals/computeds that mirrors a plain-object shape, so each leaf is an
// independently-writable `Signal` and every branch is a `Computed` that reassembles its children
// into a plain object. Reading/writing follows normal property access:
//
//   const a = buildSignalTree({ b: { c: { d: 1 } } });
//   effect(() => console.log(a()));  // logs { b: { c: { d: 1 } } }
//   a.b.c.d.set(2);                  // d notifies -> c dirty -> b dirty -> a dirty -> effect re-runs
//
// Only plain objects (`{ ... }` / `Object.create(null)`) are treated as branches; everything else
// (numbers, strings, booleans, arrays, class instances, null, undefined, functions, ...) is a leaf
// and becomes a `Signal` holding that value as-is.

import { computed, signal, type Computed, type Signal } from './index.js';

/** A plain object eligible to become a branch node; anything else is a leaf value. */
type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

/**
 * The reactive mirror of `T`: plain objects become `Computed<T>` nodes with one child property
 * per key (each itself a `SignalTree`), everything else becomes a plain `Signal<T>`.
 */
export type SignalTree<T> = T extends PlainObject
	? { readonly [K in keyof T]: SignalTree<T[K]> } & Computed<T>
	: Signal<T>;

/** Recursively makes every leaf in `T` optional, for partial tree updates via `patchTree`. */
export type DeepPartial<T> = T extends PlainObject
	? { [K in keyof T]?: DeepPartial<T[K]> }
	: T;

/** True if `node` is a leaf (`Signal`) rather than a branch (`Computed` with child properties). */
function isLeafNode(node: unknown): node is Signal<unknown> {
	return typeof node === 'function' && typeof (node as Signal<unknown>).set === 'function';
}

/**
 * Converts a plain-object value into a `SignalTree`: every leaf becomes a `signal()`, and every
 * branch becomes a `computed()` that reads all of its children and reassembles them into a plain
 * object, exposing each child as a same-named property for direct access (e.g. `tree.b.c.d`).
 */
export function buildSignalTree<T>(value: T): SignalTree<T> {
	if (!isPlainObject(value)) return signal(value) as SignalTree<T>;

	const children: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		children[key] = buildSignalTree((value as PlainObject)[key]);
	}

	const node = computed(() => {
		const result: PlainObject = {};
		for (const key of Object.keys(children)) {
			result[key] = (children[key] as Computed<unknown> | Signal<unknown>)();
		}
		return result;
	});

	return Object.assign(node, children) as SignalTree<T>;
}

/**
 * Reads a `SignalTree` back into a plain object/value without tracking it as a dependency
 * (uses `.peek()` on every leaf). Useful for logging, debugging, or one-off snapshots.
 */
export function peekTree<T>(node: SignalTree<T>): T {
	if (isLeafNode(node)) return node.peek() as T;

	const result: PlainObject = {};
	for (const key of Object.keys(node as object)) {
		result[key] = peekTree((node as unknown as Record<string, SignalTree<unknown>>)[key]);
	}
	return result as T;
}

/**
 * Writes `patch` into `tree` in place: for each provided key, recurses into branches and calls
 * `.set()` on leaves, leaving any keys omitted from `patch` untouched. Each touched leaf notifies
 * independently, so unrelated branches of the tree don't recompute.
 */
export function patchTree<T>(tree: SignalTree<T>, patch: DeepPartial<T>): void {
	if (isLeafNode(tree)) {
		(tree as Signal<unknown>).set(patch);
		return;
	}

	for (const key of Object.keys(patch as object)) {
		const value = (patch as Record<string, unknown>)[key];
		if (value === undefined) continue;
		patchTree(
			(tree as unknown as Record<string, SignalTree<unknown>>)[key],
			value as DeepPartial<unknown>,
		);
	}
}
