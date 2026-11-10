// Builds a tree of signals that mirrors a value's shape, so each leaf is an independently-writable
// `Signal` and every container (`./object`, `./array`) holds its children as nodes:
//
//   const a = signalState({ b: { c: { d: 1 } } });
//   effect(() => console.log(a.deep())); // logs { b: { c: { d: 1 } } }
//   a.b.c.d.set(2);                      // d notifies -> c, b, a deep() dirty -> effect re-runs
//
// Plain objects (`{ ... }` / `Object.create(null)`) become `SignalObject`s; arrays `SignalArray`s;
// everything else (primitives, class instances, null, undefined, functions, ...) is a leaf `Signal`.

import { signal, type SignalOptions, type Signal } from '../core/index.js';

import { signalArray, type SignalArray } from './array/index.js';
import type { ItemNode } from './node.js';
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

/** Member nodes of a branch, one per key. */
type Members<T> = { readonly [K in keyof T]: SignalState<T[K]> };

/**
 * The reactive mirror of `T`:
 * - array  → `SignalArray` of `SignalState` items (see `./array`);
 * - plain object → `SignalObject` with one `SignalState` member per key, also reachable as a
 *   same-named property (see `./object`);
 * - anything else → `SignalLeaf<T>`.
 *
 * Every node shares the same reads: `()` (child nodes, tracks replacement), `shallow()` (child
 * nodes, tracks structure), `deep()` (plain value, tracks everything below). On a leaf all three
 * are the same value read.
 */
export type SignalState<T> = T extends readonly (infer U)[]
	? SignalArray<U, SignalState<U> & ItemNode<U>>
	: IsBranch<T> extends true
		? SignalObject<T, Members<T>, DeepPartial<T>> & Members<T>
		: SignalLeaf<T>;

/** A tree leaf: a plain `Signal<T>` plus `shallow()` / `deep()`, both identical to `()`. */
export type SignalLeaf<T> = Signal<T> & {
	shallow(): T;
	deep(): T;
};

/** Wraps a core `signal()` as a tree leaf; the core primitive itself stays standard-shaped. */
function signalLeaf<T>(value: T, signalOptions?: SignalOptions<T>): SignalLeaf<T> {
	const leaf = signal(value, signalOptions) as SignalLeaf<T>;
	leaf.shallow = leaf;
	leaf.deep = leaf;
	return leaf;
}

/**
 * Converts a value into a `SignalState`: arrays become `signalArray()`s, plain objects
 * `signalObject()`s, and everything else a `SignalLeaf`, recursively.
 *
 * `signalOptions` is forwarded to every leaf `signal()` created in the tree (e.g. to customize
 * `equals`); it has no effect on containers.
 */
export function signalState<T>(value: T, signalOptions?: SignalOptions<unknown>): SignalState<T> {
	const child = (item: unknown) => signalState(item, signalOptions) as unknown as ItemNode<unknown>;
	if (Array.isArray(value)) return signalArray(value, child) as unknown as SignalState<T>;
	if (isPlainObject(value)) return signalObject(value, child) as unknown as SignalState<T>;
	return signalLeaf(value, signalOptions as SignalOptions<T>) as unknown as SignalState<T>;
}
