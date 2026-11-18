import type { Validator } from '../../main.js';
import { flags } from '../../flags.js';
import { flagged } from '../flagged.js';

type Num = number | null | undefined;

/** Fails when a number is below `n`. `null` / `undefined` pass (use `required`). */
export function min<T extends Num = Num>(n: number, message = `Must be at least ${n}`): Validator<T> {
	return flagged(
		(value: T) => (typeof value === 'number' && value < n ? { flag: flags.rangeUnderflow, message } : null),
		flags.rangeUnderflow,
	);
}

/** Fails when a number is above `n`. */
export function max<T extends Num = Num>(n: number, message = `Must be at most ${n}`): Validator<T> {
	return flagged(
		(value: T) => (typeof value === 'number' && value > n ? { flag: flags.rangeOverflow, message } : null),
		flags.rangeOverflow,
	);
}
