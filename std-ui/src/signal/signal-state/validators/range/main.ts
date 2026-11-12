import type { Validator } from '../../node.js';
import { kinds } from '../../kinds.js';

type Num = number | null | undefined;

/** Fails when a number is below `n`. `null` / `undefined` pass (use `required`). */
export function min<T extends Num = Num>(n: number, message = `Must be at least ${n}`): Validator<T> {
	return (value) => (typeof value === 'number' && value < n ? { kind: kinds.rangeUnderflow, message } : null);
}

/** Fails when a number is above `n`. */
export function max<T extends Num = Num>(n: number, message = `Must be at most ${n}`): Validator<T> {
	return (value) => (typeof value === 'number' && value > n ? { kind: kinds.rangeOverflow, message } : null);
}
