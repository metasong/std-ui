import { signal, type SignalOptions, type Signal } from '../core/index.js';
import { createValidation, type Checked } from './node.js';

/** A tree leaf: a plain `Signal<T>` plus `shallow()` / `deep()` (both identical to `()`) and validation. */
export type SignalLeaf<T> = Signal<T> &
	Checked<T> & {
		shallow(): T;
		deep(): T;
	};

/** Wraps a core `signal()` as a tree leaf; the core primitive itself stays standard-shaped. */
export function signalLeaf<T>(value: T, signalOptions?: SignalOptions<T>): SignalLeaf<T> {
	const leaf = signal(value, signalOptions) as SignalLeaf<T>;
	leaf.shallow = leaf;
	leaf.deep = leaf;
	Object.defineProperty(leaf, 'check', { value: createValidation<T>(() => leaf()) });
	return leaf;
}

