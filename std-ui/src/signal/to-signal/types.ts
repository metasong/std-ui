import type { Computed } from '../core/computed.js';

/** Minimal observer contract (structurally compatible with RxJS `Partial<Observer<T>>`). */
export interface PartialObserver<T> {
	next?: (value: T) => void;
	error?: (error: unknown) => void;
	complete?: () => void;
}

export interface Unsubscribable {
	unsubscribe(): void;
}

/** Minimal Observable-like source. RxJS `Observable`s, Svelte stores, etc. satisfy it structurally. */
export interface Subscribable<T> {
	subscribe(observer: PartialObserver<T>): Unsubscribable;
}

/** Objects exposing `[Symbol.observable]()` or `'@@observable'()` (RxJS interop). */
export interface InteropObservable<T> {
	'@@observable': () => Subscribable<T>;
}

export type ToSignalSource<T> = Subscribable<T> | InteropObservable<T> | PromiseLike<T>;

export interface ToSignalOptions<T, U = undefined> {
	/** Value read before the source produces its first value. Defaults to `undefined`. */
	initialValue?: U;
	/** Custom equality for emitted values (default `Object.is`). */
	equals?: (a: T, b: T) => boolean;
	/**
	 * Registers teardown. Pass an `effect`'s `onCleanup` or any `(fn) => disposers.push(fn)`.
	 * The subscription is also released automatically when the source completes or errors.
	 */
	onCleanup?: (cleanup: () => void) => void;
}

/** Options for `toSignalFrom` (same as `toSignal`). */
export type ToSignalFromOptions<T, U = undefined> = ToSignalOptions<T, U>;

/** The signal returned by `toSignal`: callable read + `peek()` + `dispose()`. */
export type ToSignal<V> = Computed<V> & {
	/** Stops listening: unsubscribes (observable) or ignores the late result (promise). Keeps the last value. */
	dispose(): void;
};
