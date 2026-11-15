import { signal } from '../../../../signal/core/index.js';
import type { ValidationError, Validator } from '../../main.js';
import { deepEqual } from '../../../../signal/signal-state/node.js';
import { flags } from '../../../../signal/signal-state/flags.js';

type Result = ValidationError | readonly ValidationError[] | null | undefined | void;

/** A validator whose result comes from an async check; `pending()` is true until it is known. */
export interface AsyncValidator<T> extends Validator<T> {
	/**
	 * Tracked; true while the check for the value is unknown. Without an argument it reports on the
	 * value the node last asked this validator to check (so it is `false` until the node has read
	 * it once, and follows a value change one microtask later). `node.check.pending` is the
	 * authoritative, immediately-updating aggregate.
	 */
	readonly pending: (value?: T) => boolean;
}

export interface AsyncValidatorOptions<D = unknown> {
	/** Milliseconds to wait after the value last changed before the check starts. Default `0`. */
	debounce?: number;
	/**
	 * Extra inputs the check depends on besides the node's value, e.g. `() => country()`. It is read
	 * (and tracked) with the validator, so when any signal it reads changes the check runs again.
	 * The result is handed to `check` as `ctx.deps`. A signal read inside `check` itself is NOT
	 * tracked (it runs asynchronously), so list such signals here instead.
	 */
	deps?: () => D;
	/** Maps a thrown / rejected check to errors. Default: one `customError` "Validation failed". */
	onError?: (error: unknown) => Result;
}

/**
 * Creates a validator from an async check, e.g. a server round trip. Add it to `check.validators`
 * like any other. While the result for the current value is unknown the node reports `pending`
 * (and `valid` / `allValid` are false); the validator itself reports no errors until then.
 *
 * - The check runs once per value (and `deps` result); a newer one aborts the previous through `abortSignal`.
 * - Results for a value that is no longer current are ignored.
 * - Only the latest value is cached: going back to an earlier value checks it again.
 */
export function asyncValidator<T = unknown, D = undefined>(
	check: (value: T, ctx: { abortSignal: AbortSignal; deps: D }) => Promise<Result>,
	options: AsyncValidatorOptions<D> = {},
): AsyncValidator<T> {
	const { debounce = 0, onError, deps } = options;
	type Key = { value: T; deps: D };
	const sameKey = (a: Key, b: Key) => deepEqual(a.value, b.value) && deepEqual(a.deps, b.deps);
	// Tracked read: `deps` runs inside the node's computed, so its signals become dependencies.
	const keyOf = (value: T): Key => ({ value, deps: (deps ? deps() : undefined) as D });

	const settled = signal<{ key: Key; errors: ValidationError[] } | null>(null);
	const wanted = signal<Key | null>(null); // key last requested, for argument-less `pending()`
	let requested: Key | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;

	const toList = (r: Result): ValidationError[] => (!r ? [] : Array.isArray(r) ? [...(r as ValidationError[])] : [r as ValidationError]);

	// Called from inside computeds, so it must not write signals: the work is deferred to a timer.
	const ensure = (key: Key) => {
		if (requested && sameKey(requested, key)) return;
		const mine = (requested = key);
		queueMicrotask(() => requested === mine && wanted.set(key));
		clearTimeout(timer);
		controller?.abort();
		controller = undefined;
		timer = setTimeout(async () => {
			const c = (controller = new AbortController());
			let errors: ValidationError[];
			try {
				errors = toList(await check(key.value, { abortSignal: c.signal, deps: key.deps }));
			} catch (e) {
				if (c.signal.aborted) return;
				errors = toList(onError ? onError(e) : { flag: flags.customError, message: 'Validation failed' });
			}
			if (requested === mine && !c.signal.aborted) settled.set({ key, errors });
		}, debounce);
	};

	const isSettledFor = (key: Key) => {
		const s = settled();
		return !!s && sameKey(s.key, key);
	};

	const validator = ((value: T) => {
		const key = keyOf(value);
		ensure(key);
		const s = settled();
		return s && sameKey(s.key, key) ? s.errors : null;
	}) as AsyncValidator<T>;
	(validator as { pending: (value?: T) => boolean }).pending = (...args: [T?]) => {
		if (args.length && args[0] !== undefined) {
			const key = keyOf(args[0] as T);
			ensure(key);
			return !isSettledFor(key);
		}
		// No value given: use the key the node last asked this validator to check.
		const w = wanted();
		return !!w && !isSettledFor(w);
	};
	return validator;
}
