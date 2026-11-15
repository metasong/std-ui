import type { Validator } from '../../main.js';
import { flags } from '../../../../signal/signal-state/flags.js';

type Sized = string | readonly unknown[] | null | undefined;

/** Fails when a non-empty string / array is shorter than `n`. Empty and nullish values pass (use `required`). */
export function minLength<T extends Sized = Sized>(n: number, message = `At least ${n} characters`): Validator<T> {
	return (value) => (value && value.length < n ? { flag: flags.tooShort, message } : null);
}

/** Fails when a string / array is longer than `n`. */
export function maxLength<T extends Sized = Sized>(n: number, message = `At most ${n} characters`): Validator<T> {
	return (value) => (value && value.length > n ? { flag: flags.tooLong, message } : null);
}
