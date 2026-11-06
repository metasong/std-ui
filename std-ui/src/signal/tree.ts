// Builds a tree of signals/computeds that mirrors a plain-object shape, so each leaf is an
// independently-writable `Signal` and every branch is a `Computed` that reassembles its children
// into a plain object. Reading/writing follows normal property access:
//
//   const a = signalState({ b: { c: { d: 1 } } });
//   effect(() => console.log(a()));  // logs { b: { c: { d: 1 } } }
//   a.b.c.d.set(2);                  // d notifies -> c dirty -> b dirty -> a dirty -> effect re-runs
//
// Only plain objects (`{ ... }` / `Object.create(null)`) are treated as branches; everything else
// (numbers, strings, booleans, arrays, class instances, null, undefined, functions, ...) is a leaf
// and becomes a `Signal` holding that value as-is.

import { computed, signal, type Computed, type SignalOptions, type Signal } from './core/index.js';

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

/**
 * Interface shared by every `SignalState` node, branch or leaf - identical to `Signal<T>` (callable
 * read, `.peek()`), except `.set()`/`.update()` work on `DeepPartial<T>` so branches can be patched
 * instead of replaced wholesale. For branches, `.peek()` is overridden to be a deep-untracked
 * snapshot (recursing via `.peek()` on every child), rather than `Computed`'s shallow one.
 */
type SignalTreeNode<T> = Pick<Signal<T>, 'peek'> & {
	/** Reads the current value and tracks it as a dependency. */
	(): T;
	/**
	 * Writes `partial` into this node in place: for each provided key, recurses into branches and
	 * calls `.set()` on leaves, leaving any keys omitted from `partial` untouched. Each touched leaf
	 * notifies independently, so unrelated branches of the tree don't recompute.
	 */
	set(partial: DeepPartial<T>): void;
	/** Updates the node by applying `fn` to its current (`.peek()`) value, then `.set()`-ing the result. */
	update(fn: (prev: T) => DeepPartial<T>): T;
};

/**
 * The reactive mirror of `T`: every node - branch or leaf - shares the same `SignalTreeNode`
 * interface (call to read, `.peek()`, `.set()`, `.update()`); branches additionally expose one
 * child property per key, each itself a `SignalState`.
 */
export type SignalState<T> = SignalTreeNode<T> &
	(IsBranch<T> extends true ? { readonly [K in keyof T]: SignalState<T[K]> } : unknown);

/**
 * Converts a plain-object value into a `SignalState`: every leaf becomes a `signal()`, and every
 * branch becomes a `computed()` that reads all of its children and reassembles them into a plain
 * object, exposing each child as a same-named property for direct access (e.g. `tree.b.c.d`).
 *
 * `signalOptions` is forwarded to every leaf `signal()` created in the tree (e.g. to customize
 * `equals`); it has no effect on branches, which are always `computed()`.
 */
export function signalState<T>(value: T, signalOptions?: SignalOptions<T>): SignalState<T> {
	if (!isPlainObject(value)) {
		// `Signal<T>` already provides `()`, `peek`, `set`, and `update` matching `SignalTreeNode<T>`
		// (for leaves, `DeepPartial<T>` is just `T`, and there are no children to leak through).
		return signal(value, signalOptions) as unknown as SignalState<T>;
	}

	const children: Record<string, SignalState<unknown>> = {};
	for (const key of Object.keys(value)) {
		children[key] = signalState(
			(value as PlainObject)[key],
			signalOptions as SignalOptions<unknown> | undefined,
		);
	}

	const node = computed(() => {
		const result: PlainObject = {};
		for (const key of Object.keys(children)) {
			result[key] = children[key]();
		}
		return result;
	}) as Computed<T> & Partial<SignalTreeNode<T>>;

	// Overrides `Computed`'s own (shallow-untracked) `.peek()`: that one still calls children's
	// *tracked* `()` reads internally, leaking dependencies on the whole subtree. This version
	// recurses via each child's `.peek()` instead, for a true deep-untracked snapshot.
	node.peek = (): T => {
		const result: PlainObject = {};
		for (const key of Object.keys(children)) {
			result[key] = children[key].peek();
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
	node.update = (fn: (prev: T) => DeepPartial<T>): T => {
		const next = fn(node.peek!());
		node.set!(next);
		return node.peek!();
	};

	return Object.assign(node, children) as SignalState<T>;
}
