import { signal } from '../../../core/index.js';
import { deepEqual, type ValidationError, type Validator } from '../../node.js';
import { kinds } from '../../kinds.js';

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

export interface AsyncValidatorOptions {
	/** Milliseconds to wait after the value last changed before the check starts. Default `0`. */
	debounce?: number;
	/** Maps a thrown / rejected check to errors. Default: one `customError` "Validation failed". */
	onError?: (error: unknown) => Result;
}

/**
 * Creates a validator from an async check, e.g. a server round trip. Add it to `check.validators`
 * like any other. While the result for the current value is unknown the node reports `pending`
 * (and `valid` / `allValid` are false); the validator itself reports no errors until then.
 *
 * - The check runs once per value; a newer value aborts the previous one through `signal`.
 * - Results for a value that is no longer current are ignored.
 * - Only the latest value is cached: going back to an earlier value checks it again.
 */
export function asyncValidator<T = unknown>(
	check: (value: T, ctx: { signal: AbortSignal }) => Promise<Result>,
	options: AsyncValidatorOptions = {},
): AsyncValidator<T> {
	const { debounce = 0, onError } = options;
	const settled = signal<{ value: T; errors: ValidationError[] } | null>(null);
	const wanted = signal<{ value: T } | null>(null); // value last requested, for argument-less `pending()`
	let requested: { value: T } | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | undefined;

	const toList = (r: Result): ValidationError[] => (!r ? [] : Array.isArray(r) ? [...(r as ValidationError[])] : [r as ValidationError]);

	// Called from inside computeds, so it must not write signals: the work is deferred to a timer.
	const ensure = (value: T) => {
		if (requested && deepEqual(requested.value, value)) return;
		const mine = (requested = { value });
		queueMicrotask(() => requested === mine && wanted.set({ value }));
		clearTimeout(timer);
		controller?.abort();
		controller = undefined;
		timer = setTimeout(async () => {
			const c = (controller = new AbortController());
			let errors: ValidationError[];
			try {
				errors = toList(await check(value, { signal: c.signal }));
			} catch (e) {
				if (c.signal.aborted) return;
				errors = toList(onError ? onError(e) : { kind: kinds.customError, message: 'Validation failed' });
			}
			if (requested === mine && !c.signal.aborted) settled.set({ value, errors });
		}, debounce);
	};

	const isSettledFor = (value: T) => {
		const s = settled();
		return !!s && deepEqual(s.value, value);
	};

	const validator = ((value: T) => {
		ensure(value);
		const s = settled();
		return s && deepEqual(s.value, value) ? s.errors : null;
	}) as AsyncValidator<T>;
	(validator as { pending: (value?: T) => boolean }).pending = (...args: [T?]) => {
		if (args.length && args[0] !== undefined) {
			ensure(args[0] as T);
			return !isSettledFor(args[0] as T);
		}
		// No value given: use the one the node last asked this validator to check.
		const w = wanted();
		return !!w && !isSettledFor(w.value);
	};
	return validator;
}
