import { DEV } from '../../dev/flag.js';
import type { InteropObservable, PartialObserver, Subscribable } from './types.js';

/** `Symbol.observable` if a polyfill defined it, else the RxJS string fallback. No global type augmentation. */
const observableKey = (): PropertyKey =>
	(Symbol as unknown as { observable?: symbol }).observable ?? '@@observable';

function isSubscribable<T>(s: unknown): s is Subscribable<T> {
	return typeof (s as Subscribable<T>)?.subscribe === 'function';
}

function isPromiseLike<T>(s: unknown): s is PromiseLike<T> {
	return typeof (s as PromiseLike<T>)?.then === 'function';
}

/** Wraps a settled-once async source as a one-shot `Subscribable`. */
function promiseAsSubscribable<T>(source: PromiseLike<T>): Subscribable<T> {
	return {
		subscribe(observer) {
			let active = true;
			source.then(
				v => { if (active) { observer.next?.(v); observer.complete?.(); } },
				e => { if (active) observer.error?.(e); },
			);
			return { unsubscribe: () => { active = false; } };
		},
	};
}

/**
 * Normalizes any supported source to a `Subscribable` so `toSignal` has one subscription path.
 * Promises become single-emission observables; `[Symbol.observable]` values are unwrapped.
 */
export function toSubscribable<T>(source: Subscribable<T> | InteropObservable<T> | PromiseLike<T>): Subscribable<T> {
	// `subscribe` wins over `then` when an object has both.
	if (isSubscribable<T>(source)) return source;
	if (isPromiseLike<T>(source)) return promiseAsSubscribable(source);
	const interop = (source as unknown as Record<PropertyKey, unknown>)?.[observableKey()];
	if (typeof interop === 'function') return (interop as () => Subscribable<T>).call(source);
	throw new TypeError(DEV ? 'toSignal(): source must be a Promise or have a subscribe() method.' : 'toSignal(): invalid source');
}
