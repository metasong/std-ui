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

import { computed, signal, type Computed, type Signal } from './core/signal.js';

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
type IsBranch<T> = T extends readonly unknown[]
	? false
	: T extends Function
		? false
		: T extends object
			? true
			: false;

/** Recursively makes every leaf in `T` optional, for partial tree updates via branch `.set()`. */
export type DeepPartial<T> = IsBranch<T> extends true
	? { [K in keyof T]?: DeepPartial<T[K]> }
	: T;

/** Methods present on every `SignalTree` node, branch or leaf. */
interface SignalTreeMethods<T> {
	/**
	 * Reads this node back into a plain object/value without tracking it as a dependency (uses
	 * `.peek()` on every leaf). Useful for logging, debugging, or one-off snapshots.
	 */
	peak(): T;
	/**
	 * Writes `partial` into this node in place: for each provided key, recurses into branches and
	 * calls `.set()` on leaves, leaving any keys omitted from `partial` untouched. Each touched leaf
	 * notifies independently, so unrelated branches of the tree don't recompute.
	 */
	set(partial: DeepPartial<T>): void;
}

/**
 * The reactive mirror of `T`: plain objects become `Computed<T>` nodes with one child property
 * per key (each itself a `SignalTree`), everything else becomes a plain `Signal<T>`. Every node,
 * branch or leaf, also carries `.peak()` and branch-level `.set(partial)` (see `SignalTreeMethods`).
 */
export type SignalTree<T> = IsBranch<T> extends true
	? { readonly [K in keyof T]: SignalTree<T[K]> } & Computed<T> & SignalTreeMethods<T>
	: Signal<T> & SignalTreeMethods<T>;

/**
 * Converts a plain-object value into a `SignalTree`: every leaf becomes a `signal()`, and every
 * branch becomes a `computed()` that reads all of its children and reassembles them into a plain
 * object, exposing each child as a same-named property for direct access (e.g. `tree.b.c.d`).
 */
export function buildSignalTree<T>(value: T): SignalTree<T> {
	if (!isPlainObject(value)) {
		const leaf = signal(value) as Signal<T> & Partial<SignalTreeMethods<T>>;
		leaf.peak = () => leaf.peek();
		return leaf as SignalTree<T>;
	}

	const children: Record<string, SignalTree<unknown>> = {};
	for (const key of Object.keys(value)) {
		children[key] = buildSignalTree((value as PlainObject)[key]);
	}

	const node = computed(() => {
		const result: PlainObject = {};
		for (const key of Object.keys(children)) {
			result[key] = children[key]();
		}
		return result;
	}) as Computed<T> & Partial<SignalTreeMethods<T>>;

	node.peak = (): T => {
		const result: PlainObject = {};
		for (const key of Object.keys(children)) {
			result[key] = children[key].peak();
		}
		return result as T;
	};
	node.set = (partial: DeepPartial<T>): void => {
		for (const key of Object.keys(partial as object)) {
			const value = (partial as Record<string, unknown>)[key];
			if (value === undefined) continue;
			children[key].set(value as DeepPartial<unknown>);
		}
	};

	return Object.assign(node, children) as SignalTree<T>;
}
