import type { Validator } from '../../main.js';
import { flags } from '../../flags.js';
import { flagged } from '../flagged.js';

type Sized = string | readonly unknown[] | null | undefined;

/** Fails when a non-empty string / array is shorter than `n`. Empty and nullish values pass (use `required`). */
export function minLength<T extends Sized = Sized>(n: number, message = `At least ${n} characters`): Validator<T> {
	return flagged((value: T) => (value && value.length < n ? { flag: flags.tooShort, message } : null), flags.tooShort);
}

/** Fails when a string / array is longer than `n`. */
export function maxLength<T extends Sized = Sized>(n: number, message = `At most ${n} characters`): Validator<T> {
	return flagged((value: T) => (value && value.length > n ? { flag: flags.tooLong, message } : null), flags.tooLong);
}
