import { isState, type State } from '@std-ui/core';
import { toSignal, type ToSignal, type ToSignalOptions, type ToSignalSource } from '../to-signal/index.js';
import { toStateLeaf, type StateLeaf } from './leaf.js';

/** A read-only state leaf fed by an observable / promise, with `dispose()` to stop listening. */
export type ToStore<V> = Omit<StateLeaf<V>, 'set' | 'update'> & { dispose(): void };

/**
 * `toSignal()` for stores: subscribes to `source` and exposes the latest value as a state
 * leaf (`()`, `shallow()`, `deep()`, validation, `changes`) so it can be read like, and adopted
 * into, a `store()` tree. Accepts the same source and options as `toSignal()`.
 *
 * Given a writable `State` instead, it is upgraded in place via `toStateLeaf()` and stays writable.
 *
 * For observable / promise sources the leaf is read-only: it has no `set` / `update` (its value comes from `source`), so
 * `changes.reset()` style writes are not supported.
 */
export function toStore<T>(source: State<T>): StateLeaf<T>;
export function toStore<T>(source: ToSignalSource<T>): ToStore<T | undefined>;
export function toStore<T, const U extends T | null | undefined>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, U> & { initialValue: U },
): ToStore<T | U>;
export function toStore<T>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, undefined>,
): ToStore<T | undefined>;
export function toStore<T, U>(
	source: State<T> | ToSignalSource<T>,
	options: ToSignalOptions<T, U> = {},
): StateLeaf<T> | ToStore<T | U | undefined> {
	// A writable signal is upgraded in place (shared, still writable); `options` don't apply.
	if (isState(source)) return toStateLeaf(source as State<T>);
	return fromSource(source as ToSignalSource<T>, options);
}

function fromSource<T, U>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, U>,
): ToStore<T | U | undefined> {
	const sig: ToSignal<T | U | undefined> = toSignal(source, options as ToSignalOptions<T, undefined>);
	// Upgrade the computed in place; it keeps its `dispose`.
	return toStateLeaf(sig as unknown as State<T | U | undefined>) as unknown as ToStore<T | U | undefined>;
}
