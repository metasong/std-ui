import { state, type SignalOptions, type State } from '@std-ui/core';
import { addWith, EQUALS, type Extendable } from './node.js';

/**
 * A tree leaf: a plain `State<T>` plus `shallow()` / `deep()` (both identical to `get()`) and `with()`.
 * Validation (`check`) and change tracking (`changes`) are separate features added through `with()`.
 */
export type StateLeaf<T> = State<T> &
	Extendable & {
		shallow(): T;
		deep(): T;
	};

/** Wraps a core `state()` as a tree leaf; the core primitive itself stays standard-shaped. */
export function stateLeaf<T>(value: T, signalOptions?: SignalOptions<T>): StateLeaf<T> {
	return toStateLeaf(state(value, signalOptions), signalOptions?.equals);
}

/**
 * Upgrades an existing core `State<T>` into a tree leaf, in place: the same signal object gains
 * `shallow()` / `deep()` and `with()`, so it is shared, not copied. `equals` is remembered for
 * features that compare values (`changes`; default deep equality). Returns it unchanged if it is
 * already a leaf. The result can be adopted as a member of `stateTree()` trees like any other node.
 */
export function toStateLeaf<T>(source: State<T>, equals?: (a: T, b: T) => boolean): StateLeaf<T> {
	if (isStateLeaf(source)) return source;
	const leaf = source as StateLeaf<T>;
	leaf.shallow = () => leaf.get();
	leaf.deep = () => leaf.get();
	addWith(leaf);
	if (equals) (leaf as { [EQUALS]?: unknown })[EQUALS] = equals;
	return leaf;
}

function isStateLeaf<T>(value: State<T>): value is StateLeaf<T> {
	const v = value as Partial<StateLeaf<T>>;
	return typeof v.deep === 'function' && typeof v.shallow === 'function' && typeof v.with === 'function';
}
