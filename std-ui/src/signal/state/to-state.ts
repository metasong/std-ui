import type { Signal } from '../core/index.js';
import { toSignal, type ToSignal, type ToSignalOptions, type ToSignalSource } from '../to-signal/index.js';
import { toSignalLeaf, type SignalLeaf } from './leaf.js';

/** A read-only state leaf fed by an observable / promise, with `dispose()` to stop listening. */
export type ToState<V> = Omit<SignalLeaf<V>, 'set' | 'update'> & { dispose(): void };

/**
 * `toSignal()` for state trees: subscribes to `source` and exposes the latest value as a state
 * leaf (`()`, `shallow()`, `deep()`, validation, `changes`) so it can be read like, and adopted
 * into, a `state()` tree. Accepts the same source and options as `toSignal()`.
 *
 * Given a writable `Signal` instead, it is upgraded in place via `toSignalLeaf()` and stays writable.
 *
 * For observable / promise sources the leaf is read-only: it has no `set` / `update` (its value comes from `source`), so
 * `changes.reset()` style writes are not supported.
 */
export function toState<T>(source: Signal<T>): SignalLeaf<T>;
export function toState<T>(source: ToSignalSource<T>): ToState<T | undefined>;
export function toState<T, const U extends T | null | undefined>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, U> & { initialValue: U },
): ToState<T | U>;
export function toState<T>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, undefined>,
): ToState<T | undefined>;
export function toState<T, U>(
	source: Signal<T> | ToSignalSource<T>,
	options: ToSignalOptions<T, U> = {},
): SignalLeaf<T> | ToState<T | U | undefined> {
	// A writable signal is upgraded in place (shared, still writable); `options` don't apply.
	if (isSignal<T>(source)) return toSignalLeaf(source);
	return fromSource(source as ToSignalSource<T>, options);
}

function isSignal<T>(value: unknown): value is Signal<T> {
	const v = value as { peek?: unknown; set?: unknown } | null;
	return typeof value === 'function' && typeof v?.peek === 'function' && typeof v?.set === 'function';
}

function fromSource<T, U>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, U>,
): ToState<T | U | undefined> {
	const sig: ToSignal<T | U | undefined> = toSignal(source, options as ToSignalOptions<T, undefined>);
	// Upgrade the computed in place; it keeps its `dispose`.
	return toSignalLeaf(sig as unknown as Signal<T | U | undefined>) as unknown as ToState<T | U | undefined>;
}
