import { signal, type SignalOptions, type Signal } from '../signal/index.js';
import { addWith, EQUALS, type Extendable } from './node.js';

/**
 * A tree leaf: a plain `Signal<T>` plus `shallow()` / `deep()` (both identical to `()`) and `with()`.
 * Validation (`check`) and change tracking (`changes`) are separate features added through `with()`.
 */
export type SignalLeaf<T> = Signal<T> &
	Extendable & {
		shallow(): T;
		deep(): T;
	};

/** Wraps a core `signal()` as a tree leaf; the core primitive itself stays standard-shaped. */
export function signalLeaf<T>(value: T, signalOptions?: SignalOptions<T>): SignalLeaf<T> {
	return toSignalLeaf(signal(value, signalOptions), signalOptions?.equals);
}

/**
 * Upgrades an existing core `Signal<T>` into a tree leaf, in place: the same signal object gains
 * `shallow()` / `deep()` and `with()`, so it is shared, not copied. `equals` is remembered for
 * features that compare values (`changes`; default deep equality). Returns it unchanged if it is
 * already a leaf. The result can be adopted as a member of `state()` trees like any other node.
 */
export function toSignalLeaf<T>(source: Signal<T>, equals?: (a: T, b: T) => boolean): SignalLeaf<T> {
	if (isSignalLeaf(source)) return source;
	const leaf = source as SignalLeaf<T>;
	leaf.shallow = leaf;
	leaf.deep = leaf;
	addWith(leaf);
	if (equals) (leaf as { [EQUALS]?: unknown })[EQUALS] = equals;
	return leaf;
}

function isSignalLeaf<T>(value: Signal<T>): value is SignalLeaf<T> {
	const v = value as Partial<SignalLeaf<T>>;
	return typeof v.deep === 'function' && typeof v.shallow === 'function' && typeof v.with === 'function';
}
