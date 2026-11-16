// The error shapes validation reports, defined in the core because `bind()` and `FormElement`
// read them. The validation feature itself (`check()`, validators) lives in `std-ui-ext`.

import type { ValidityFlag } from './flags.js';

export interface ValidationError {
	/** One of the well-known `flags` (the `ValidityState` flag names), e.g. `flags.tooShort`. */
	flag: ValidityFlag;
	message: string;
}

/** An error plus where it came from, relative to the node it was read from ([] = the node itself). */
export interface PathError extends ValidationError {
	path: (string | number)[];
}
