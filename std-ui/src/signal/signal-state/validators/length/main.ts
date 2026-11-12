import type { Validator } from '../../node.js';
import { kinds } from '../../kinds.js';

type Sized = string | readonly unknown[] | null | undefined;

/** Fails when a non-empty string / array is shorter than `n`. Empty and nullish values pass (use `required`). */
export function minLength<T extends Sized = Sized>(n: number, message = `At least ${n} characters`): Validator<T> {
	return (value) => (value && value.length < n ? { kind: kinds.tooShort, message } : null);
}

/** Fails when a string / array is longer than `n`. */
export function maxLength<T extends Sized = Sized>(n: number, message = `At most ${n} characters`): Validator<T> {
	return (value) => (value && value.length > n ? { kind: kinds.tooLong, message } : null);
}
