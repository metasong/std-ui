import { signal, type SignalOptions, type Signal } from '../core/index.js';

/** A tree leaf: a plain `Signal<T>` plus `shallow()` / `deep()`, both identical to `()`. */
export type SignalLeaf<T> = Signal<T> & {
	shallow(): T;
	deep(): T;
};

/** Wraps a core `signal()` as a tree leaf; the core primitive itself stays standard-shaped. */
export function signalLeaf<T>(value: T, signalOptions?: SignalOptions<T>): SignalLeaf<T> {
	const leaf = signal(value, signalOptions) as SignalLeaf<T>;
	leaf.shallow = leaf;
	leaf.deep = leaf;
	return leaf;
}
