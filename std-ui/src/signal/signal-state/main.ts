// Builds a tree of signals that mirrors a value's shape, so each leaf is an independently-writable
// `Signal` and every container (`./object`, `./array`) holds its children as nodes:
//
//   const a = state({ b: { c: { d: 1 } } });
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
export type SignalState<T> = [T] extends [boolean] // `boolean` is `true | false`: don't distribute it into a union of leaves (`.set(true)` would need `never`)
	? SignalLeaf<T>
	: T extends readonly (infer U)[]
		? SignalArray<U, SignalState<U> & ItemNode<U>>
		: IsBranch<T> extends true
			? SignalObject<T, Members<T>, DeepPartial<T>> & Members<T>
			: SignalLeaf<T>;

/** How far a tree is built: `'value'` = one leaf, `'shallow'` = container + leaf members, `'deep'` = full tree. */
export type StateDepth = 'value' | 'shallow' | 'deep';

/** `state()` options: the leaf `signal()` options plus how deep to build. */
export interface SignalStateOptions<T = unknown> extends SignalOptions<T> {
	/**
	 * - `'deep'` (default): every nested object / array becomes a node.
	 * - `'shallow'`: the root is a container node (`SignalObject` / `SignalArray`) but each member is
	 *   a leaf holding its value as-is, so nested objects are not walked and only replacing a
	 *   member notifies. Existing nodes passed as members are still adopted.
	 * - `'value'`: the whole value is a single leaf `Signal`, whatever its shape.
	 *
	 * Reads collapse with the depth: on a `'value'` tree `()`, `shallow()` and `deep()` are the same
	 * read, and `valid` / `errors` / `pending` equal their `all*` aggregates (a leaf has no children);
	 * on a `'shallow'` tree `deep()` is `shallow()`, tracking structure and member replacement.
	 */
	depth?: StateDepth;
}

/** Members of a shallow container: one plain leaf per key. */
type LeafMembers<T> = { readonly [K in keyof T]: SignalLeaf<T[K]> };

/** The tree `state()` builds with `depth: 'shallow'`. */
export type SignalStateShallow<T> = T extends readonly (infer U)[]
	? SignalArray<U, SignalLeaf<U> & ItemNode<U>>
	: IsBranch<T> extends true
		? SignalObject<T, LeafMembers<T>, Partial<T>> & LeafMembers<T>
		: SignalLeaf<T>;

/** What `state(value, { depth: D })` returns for a value of type `T`. */
export type SignalStateOf<T, D extends StateDepth> = D extends 'value'
	? SignalLeaf<Plain<T>>
	: D extends 'shallow'
		? SignalStateShallow<Plain<T>>
		: SignalState<Plain<T>>;

/**
 * Converts a value into a `SignalState`: arrays become `signalArray()`s, plain objects
 * `signalObject()`s, and everything else a `SignalLeaf`, recursively.
 *
 * `options` is forwarded to every leaf `signal()` created in the tree (e.g. to customize
 * `equals`); it has no effect on containers. `options.depth` limits how deep the tree is built
 * (`'deep'` default, `'shallow'`, `'value'`; see `SignalStateOptions`). A shallow or value tree
 * does not walk its members, so a circular reference inside a raw member value is not rejected
 * (and a dirty check (`changes`) on such a value would recurse forever).
 *
 * Composition: a member that is already a tree node (built by `state()` etc.) is adopted
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
export function state<T, D extends StateDepth = 'deep'>(
	value: T,
	options?: SignalStateOptions & { depth?: D },
): SignalStateOf<T, D> {
	const { depth = 'deep', ...leafOptions } = options ?? {};
	return build<unknown>(value, leafOptions, depth, new Set()) as unknown as SignalStateOf<T, D>;
}

/** `ancestors` holds the containers on the current construction path (not every visited one). */
function build<T>(
	value: T,
	signalOptions: SignalOptions<unknown> | undefined,
	depth: StateDepth,
	ancestors: Set<object>,
): SignalState<T> {
	// Composition: an existing tree node is adopted as-is, so the parent reads, validates and tracks it.
	if (isTreeNode(value)) return value as SignalState<T>;
	// `'value'` stops here: whatever the shape, it is one leaf holding the value as-is.
	if (depth === 'value') return signalLeaf(value, signalOptions as SignalOptions<T>) as unknown as SignalState<T>;
	const container = Array.isArray(value) || isPlainObject(value);
	if (container) {
		if (ancestors.has(value as object)) {
			throw new TypeError('state: circular reference detected; state must be a finite tree of plain data');
		}
		ancestors.add(value as object);
	}
	try {
		// Members of a shallow container are leaves (`'value'`); a deep tree recurses.
		const memberDepth: StateDepth = depth === 'shallow' ? 'value' : 'deep';
		const child = (item: unknown) => build(item, signalOptions, memberDepth, ancestors) as unknown as ItemNode<unknown>;
		if (Array.isArray(value) || isPlainObject(value)) {
			const node = Array.isArray(value) ? signalArray(value, child) : signalObject(value as PlainObject, child);
			// Members built here are leaves, whose `deep()` is just their replacement, so `deep()` is
			// structure + member replacement and equals `shallow()`. An adopted deep node is still
			// tracked through its own `deep()` (this is the one place a shallow parent reaches inside).
			if (depth === 'shallow') (node as { shallow(): unknown }).shallow = node.deep;
			return node as unknown as SignalState<T>;
		}
		return signalLeaf(value, signalOptions as SignalOptions<T>) as unknown as SignalState<T>;
	} finally {
		if (container) ancestors.delete(value as object);
	}
}
