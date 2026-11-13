// Builds a tree of signals that mirrors a value's shape, so each leaf is an independently-writable
// `Signal` and every container (`./object`, `./array`) holds its children as nodes:
//
//   const a = signalState({ b: { c: { d: 1 } } });
//   effect(() => console.log(a.deep())); // logs { b: { c: { d: 1 } } }
//   a.b.c.d.set(2);                      // d notifies -> c, b, a deep() dirty -> effect re-runs
//
// Plain objects (`{ ... }` / `Object.create(null)`) become `SignalObject`s; arrays `SignalArray`s;
// everything else (primitives, class instances, null, undefined, functions, ...) is a leaf `Signal`.

import type { SignalOptions } from '../core/index.js';

import { signalArray, type SignalArray } from './array/index.js';
import { signalLeaf, type SignalLeaf } from './leaf.js';
import { isTreeNode, type ItemNode, type TreeNode } from './node.js';
import { signalObject, type SignalObject } from './object/index.js';

/** A plain object eligible to become a branch node; anything else is a leaf value. */
type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

// Type-level stand-in for `isPlainObject()`'s runtime check. NOTE: deliberately looser than the
// runtime check (any non-array, non-function object type, not just `{ ... }` literal shapes) -
// `T extends Record<string, unknown>` would be the literal translation, but named `interface`s
// (as opposed to object-literal `type` aliases) don't satisfy that constraint in a conditional
// type even when they're plain data shapes (a long-standing TS quirk: interfaces don't get an
// implicit index signature for `extends` checks the way type-literals do), which would wrongly
// push every `interface`-typed branch (e.g. this app's `AppState`/`Config`) down the `Signal<T>`
// leaf path instead of the branch path.
type IsBranch<T> = T extends readonly unknown[] // array → leaf
	? false
	: T extends Function // function → leaf
		? false
		: T extends object // object (incl. null in TS) → branch
			? true
			: false; // primitive(number, string, boolean, bigint, symbol, etc.) | undefined → leaf

/** Recursively makes every leaf in `T` optional, for partial tree updates via branch `.set()`. */
export type DeepPartial<T> = IsBranch<T> extends true // is none array obj(incl. null)?
? { [K in keyof T]?: DeepPartial<T[K]> } // branch → optional nested keys
	: T; // leaf → whole value

/** True when `T` is, or contains at any depth, an existing tree node. */
type HasNode<T> = T extends TreeNode
	? true
	: T extends readonly (infer U)[]
		? HasNode<U>
		: IsBranch<T> extends true
			? true extends { [K in keyof T]: HasNode<T[K]> }[keyof T]
				? true
				: false
			: false;

/** `T` with every member that is already a tree node replaced by that node's plain value type. */
type Unwrap<T> = T extends TreeNode
	? ReturnType<T['peek']>
	: T extends readonly (infer U)[]
		? Unwrap<U>[]
		: IsBranch<T> extends true
			? { [K in keyof T]: Unwrap<T[K]> }
			: T;

/** The plain value type of `T`; `T` itself when it holds no nodes. */
export type Plain<T> = HasNode<T> extends true ? Unwrap<T> : T;

/** Member nodes of a branch, one per key. */
type Members<T> = { readonly [K in keyof T]: SignalState<T[K]> };

/**
 * The reactive mirror of `T`:
 * - array  → `SignalArray` of `SignalState` items (see `./array`);
 * - plain object → `SignalObject` with one `SignalState` member per key, also reachable as a
 *   same-named property (see `./object`);
 * - anything else → `SignalLeaf<T>`.
 *
 * Every node shares the same reads, all returning the plain value: `()` (tracks replacement),
 * `shallow()` (tracks structure), `deep()` (tracks everything below). On a leaf all three are the
 * same read.
 */
export type SignalState<T> = T extends readonly (infer U)[]
	? SignalArray<U, SignalState<U> & ItemNode<U>>
	: IsBranch<T> extends true
		? SignalObject<T, Members<T>, DeepPartial<T>> & Members<T>
		: SignalLeaf<T>;

/**
 * Converts a value into a `SignalState`: arrays become `signalArray()`s, plain objects
 * `signalObject()`s, and everything else a `SignalLeaf`, recursively.
 *
 * `signalOptions` is forwarded to every leaf `signal()` created in the tree (e.g. to customize
 * `equals`); it has no effect on containers.
 *
 * Composition: a member that is already a tree node (built by `signalState()` etc.) is adopted
 * as-is, not wrapped: the parent tracks it, and `deep()`, `check` and `changes` include it. The
 * node is shared, not copied, so writing through either owner affects both. Adoption happens when
 * a member is *built* (construction, or a new key / item); from the parent's view that member is
 * just data of the node's value type (`Plain<T>`), so a node can't be passed to replace an
 * existing member. A node that would end up containing itself is rejected.
 *
 * Throws a `TypeError` on a circular reference (an object or array that contains itself, directly
 * or through descendants). The tree models finite plain data: a back-reference can't be a node
 * (it would be an infinite tree) and, as a leaf, would hold a stale raw copy that silently drifts
 * from the reactive tree. Shared, non-circular plain references are fine; each occurrence becomes
 * its own independent node.
 */
export function signalState<T>(value: T, signalOptions?: SignalOptions<unknown>): SignalState<Plain<T>> {
	return build<unknown>(value, signalOptions, new Set()) as unknown as SignalState<Plain<T>>;
}

/** `ancestors` holds the containers on the current construction path (not every visited one). */
function build<T>(value: T, signalOptions: SignalOptions<unknown> | undefined, ancestors: Set<object>): SignalState<T> {
	// Composition: an existing tree node is adopted as-is, so the parent reads, validates and tracks it.
	if (isTreeNode(value)) return value as SignalState<T>;
	const container = Array.isArray(value) || isPlainObject(value);
	if (container) {
		if (ancestors.has(value as object)) {
			throw new TypeError('signalState: circular reference detected; state must be a finite tree of plain data');
		}
		ancestors.add(value as object);
	}
	try {
		const child = (item: unknown) => build(item, signalOptions, ancestors) as unknown as ItemNode<unknown>;
		if (Array.isArray(value)) return signalArray(value, child) as unknown as SignalState<T>;
		if (isPlainObject(value)) return signalObject(value, child) as unknown as SignalState<T>;
		return signalLeaf(value, signalOptions as SignalOptions<T>) as unknown as SignalState<T>;
	} finally {
		if (container) ancestors.delete(value as object);
	}
}
