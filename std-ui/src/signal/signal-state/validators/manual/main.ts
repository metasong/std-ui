import { signal } from '../../../core/index.js';
import { deepEqual, type ValidationError, type Validator } from '../../node.js';

/** A validator driven by calls instead of a rule: `set` its errors, `clear` them. */
export interface ManualValidator<T> extends Validator<T> {
	/**
	 * Sets this validator's error message(s), replacing its earlier ones. Each becomes a
	 * `customError`. They apply to the node's value at that moment and stop once it changes. An
	 * empty list clears them.
	 */
	set(messages: string | readonly string[]): void;
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
		const messages = typeof e === 'string' ? [e] : [...e];
		const list = messages.map((message): ValidationError => ({ kind: 'customError', message }));
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
