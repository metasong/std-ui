import type { Validator } from '../../node.js';
import { flags } from '../../flags.js';

/** Fails for `null`, `undefined`, `''` and `[]`. Everything else (`0`, `false`, `' '`) counts as filled. */
export function required<T = unknown>(message = 'Required'): Validator<T> {
	return (value) => {
		const empty =
			value === null ||
			value === undefined ||
			(typeof value === 'string' && value === '') ||
			(Array.isArray(value) && value.length === 0);
		return empty ? { flag: flags.valueMissing, message } : null;
	};
}
