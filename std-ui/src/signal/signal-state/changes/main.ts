// Change tracking for tree nodes, kept separate from the state core: a plain `state()` has no
// `changes`; `changes(state(...))` (or `state(...).with(changes)`) adds `dirty` / `initial` /
// `reset` to the node and every descendant, including members added later, and returns the same
// tree typed with `changes` on each node.
//
// The initial value of each node is its value when `changes()` is applied (for a member added
// later: its value when it is created), so apply it before editing the state.

import { computed, signal, type Computed } from '../../core/index.js';
import type { SignalArray } from '../array/index.js';
import { childEntries, deepEqual, EQUALS, extendTree, type ItemNode, type TreeNode } from '../node.js';
import type { SignalObject } from '../object/index.js';

/** Change-tracking members (`dirty`, `initial`, `reset`), grouped under `node.changes`. */
export interface ChangeTracking<T> {
	/** Tracked; true when the node's current value differs (deeply) from its initial value. */
	readonly dirty: Computed<boolean>;
	/** Tracked; the initial value: what `reset()` restores. Replaced when `reset(next)` is given a `next`. */
	readonly initial: Computed<T>;
	/**
	 * Writes the initial value back (members added since are removed, deleted ones re-created). With
	 * `next`, `next` first becomes the new initial value, e.g. `reset(node.peek())` marks the current
	 * value as saved.
	 */
	reset(next?: T): void;
}

/** Mixin added to every node by `changes()`: its change-tracking members under `changes`. */
export interface Changed<T> {
	readonly changes: ChangeTracking<T>;
}

type ChangedMembers<M> = { readonly [K in keyof M]: WithChanges<M[K]> };

/**
 * A state tree `S` after `changes()`: the same tree, with `changes` on every node (members and
 * items too). Built on `S` itself (not rebuilt), so other features already on it are kept.
 */
export type WithChanges<S> =
	S extends SignalArray<infer U, infer N>
		? {
				at(index: number): WithChanges<N> | undefined;
				readonly [index: number]: WithChanges<N> | undefined;
			} & S &
				Changed<U[]>
		: S extends SignalObject<infer T, infer M, any>
			? { readonly _: ChangedMembers<M> } & { readonly [K in keyof T]: WithChanges<S[K & keyof S]> } & S & Changed<T>
			: S extends { peek(): infer T }
				? S & Changed<T>
				: S;

/**
 * Adds change tracking to a state tree: `changes(state({ name: '' })).name.changes.dirty()`, or
 * chained: `state(...).with(check).with(changes)`. Returns the same tree (not a copy). Members
 * added later (`push`, new keys) get `changes` too. Safe to apply twice.
 */
export function changes<S extends TreeNode>(node: S): WithChanges<S> {
	extendTree(node, attach);
	return node as unknown as WithChanges<S>;
}

/** The `changes()` extension: gives one node its `changes`, with its current value as the initial value. */
function attach(node: object): void {
	const n = node as TreeNode & { delete?: (key: string) => boolean; splice?: unknown; _?: object };
	const equals = (n as { [EQUALS]?: (a: unknown, b: unknown) => boolean })[EQUALS];
	Object.defineProperty(n, 'changes', {
		value: createChangeTracking<unknown>(() => n.deep(), n.peek(), (base) => restore(n, base), equals),
	});
}

/**
 * The node's own write-back of an initial value, then the same value pushed to every child so each
 * level agrees on it (a child drops its own extras, and a re-created child starts from it).
 */
function restore(n: TreeNode & { delete?: (key: string) => boolean; splice?: unknown; _?: object }, base: unknown): void {
	if (n._ && n.delete) {
		const target = base as Record<string, unknown>;
		for (const [key] of childEntries(n)) {
			if (!Object.prototype.hasOwnProperty.call(target, String(key))) n.delete(String(key));
		}
		n.set(target); // re-creates missing members, clears an emptied object
		for (const [key, child] of childEntries(n)) resetChild(child, target[key as string]);
	} else if (typeof n.splice === 'function') {
		const target = base as unknown[];
		n.set(target);
		for (const [i, child] of childEntries(n)) resetChild(child, target[i as number]);
	} else {
		n.set(base);
	}
}

function resetChild(child: unknown, base: unknown): void {
	(child as ItemNode<unknown>).changes?.reset(base);
}

/**
 * Builds the `dirty` / `initial` / `reset` members for a node. `read` is the tracked plain value,
 * `initial` the first initial value, and `restore` the node's own write-back of an initial value.
 * `equals` decides when the value counts as unchanged (default: `deepEqual`).
 */
function createChangeTracking<T>(
	read: () => T,
	initial: T,
	restore: (initial: T) => void,
	equals: (a: T, b: T) => boolean = deepEqual,
): ChangeTracking<T> {
	const currentInitial = signal(initial);
	return {
		dirty: computed(() => !equals(read(), currentInitial())),
		initial: computed(() => currentInitial()),
		reset: (...args: [T?]) => {
			if (args.length) currentInitial.set(args[0] as T);
			restore(currentInitial.peek());
		},
	};
}
