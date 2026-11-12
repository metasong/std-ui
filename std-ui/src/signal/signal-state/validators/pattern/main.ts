import type { ValidationError, Validator } from '../../node.js';
import { flags } from '../../flags.js';

/** Fails when a non-empty string does not match `regex`. Empty and nullish values pass (use `required`). */
export function pattern<T extends string | null | undefined = string>(
	regex: RegExp,
	message = 'Invalid format',
): Validator<T> {
	return (value) => {
		if (!value) return null;
		regex.lastIndex = 0; // global / sticky regexes keep state between tests
		return regex.test(value) ? null : { flag: flags.patternMismatch, message };
	};
}

/** Pragmatic email shape check (`a@b.c`), not full RFC validation. */
export function email<T extends string | null | undefined = string>(message = 'Invalid email'): Validator<T> {
	const check = pattern<T>(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message);
	return (value) => {
		const e = check(value) as ValidationError | null;
		return e ? { flag: flags.typeMismatch, message: e.message } : null;
	};
}
