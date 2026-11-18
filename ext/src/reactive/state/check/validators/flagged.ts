import type { Validator } from '../main.js';
import type { ValidityFlag } from '../flags.js';

/**
 * Tags a validator with the validity flag it reports (`required` → `valueMissing`, `minLength` →
 * `tooShort`, ...), so consumers can tell which constraints a node has without running it.
 * Validators that report varying flags (`asyncValidator`, `manual`) are not tagged.
 */
export function flagged<T, F extends ValidityFlag>(
	validator: Validator<T>,
	flag: F,
): Validator<T> & { readonly flag: F } {
	return Object.assign(validator, { flag });
}
