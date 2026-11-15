import { signal, type SignalOptions, type Signal } from '../core/index.js';
import { attachCheck, type Checked } from './check/index.js';
import { createChangeTracking, type Tracked } from './node.js';

/** A tree leaf: a plain `Signal<T>` plus `shallow()` / `deep()` (both identical to `()`) and validation. */
export type SignalLeaf<T> = Signal<T> &
	Checked<T> &
	Tracked<T> & {
		shallow(): T;
		deep(): T;
	};

/** Wraps a core `signal()` as a tree leaf; the core primitive itself stays standard-shaped. */
export function signalLeaf<T>(value: T, signalOptions?: SignalOptions<T>): SignalLeaf<T> {
	return toSignalLeaf(signal(value, signalOptions), signalOptions?.equals);
}

/**
 * Upgrades an existing core `Signal<T>` into a tree leaf, in place: the same signal object gains
 * `shallow()` / `deep()`, validation and `changes` (baseline = its current value; `equals` decides when `changes.dirty` is false, default deep equality), so it is shared,
 * not copied. Returns it unchanged if it is already a leaf. The result can be adopted as a member
 * of `state()` trees like any other node.
 */
export function toSignalLeaf<T>(source: Signal<T>, equals?: (a: T, b: T) => boolean): SignalLeaf<T> {
	if (isSignalLeaf(source)) return source;
	const initial = source.peek();
	const leaf = source as SignalLeaf<T>;
	leaf.shallow = leaf;
	leaf.deep = leaf;
	attachCheck<T>(leaf, () => leaf());
	Object.defineProperty(leaf, 'changes', {
		value: createChangeTracking(() => leaf(), initial, (base) => leaf.set(base), equals),
	});
	return leaf;
}

function isSignalLeaf<T>(value: Signal<T>): value is SignalLeaf<T> {
	const v = value as Partial<SignalLeaf<T>>;
	return typeof v.deep === 'function' && typeof v.shallow === 'function' && 'changes' in v;
}
