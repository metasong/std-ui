import { signal } from '../../../../core/index.js';
import type { ValidationError, Validator } from '../../main.js';
import { deepEqual } from '../../../node.js';
import { flags } from '../../../flags.js';

/** A message (flag `customError`) or an error with one of the well-known flags. */
export type ManualError = string | ValidationError;

/** A validator driven by calls instead of a rule: `set` its errors, `clear` them. */
export interface ManualValidator<T> extends Validator<T> {
	/**
	 * Sets this validator's errors, replacing its earlier ones. A plain message becomes a
	 * `customError`; pass `{ flag, message }` to choose one of the `flags`. They apply to the node's value at
	 * that moment and stop once it changes. An empty list clears them.
	 */
	set(errors: ManualError | readonly ManualError[]): void;
	/** Removes this validator's errors. */
	clear(): void;
}

/**
 * Creates a validator whose errors are pushed from outside (e.g. an API response) instead of
 * computed from a rule. Add it to `check.validators` like any other; create several if needed.
 * Its errors apply to the value the node holds when they are set and drop once that value changes.
 */
export function manualValidator<T = unknown>(): ManualValidator<T> {
	const state = signal<ValidationError[] | null>(null);
	let at: { value: T } | null = null; // value the errors belong to, captured on first run after `set`
	let expired = false;
	const validator = ((value: T) => {
		const errs = state();
		if (!errs) return null;
		if (expired) return null;
		if (!at) at = { value };
		if (deepEqual(at.value, value)) return errs;
		expired = true; // value moved on: stay dropped even if it later returns to the old value
		return null;
	}) as ManualValidator<T>;
	validator.set = (e) => {
		const items: readonly ManualError[] = typeof e === 'string' || !Array.isArray(e) ? [e as ManualError] : e;
		const list = items.map(
			(item): ValidationError =>
				typeof item === 'string' ? { flag: flags.customError, message: item } : { ...item },
		);
		at = null;
		expired = false;
		state.set(list.length ? list : null);
	};
	validator.clear = () => {
		at = null;
		expired = false;
		state.set(null);
	};
	return validator;
}
