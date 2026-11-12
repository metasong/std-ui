/**
 * Error kinds: the `ValidityState` flag names accepted by `ElementInternals.setValidity()`.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
 */
export const kinds = {
	valueMissing: 'valueMissing',
	typeMismatch: 'typeMismatch',
	patternMismatch: 'patternMismatch',
	tooLong: 'tooLong',
	tooShort: 'tooShort',
	rangeUnderflow: 'rangeUnderflow',
	rangeOverflow: 'rangeOverflow',
	stepMismatch: 'stepMismatch',
	badInput: 'badInput',
	customError: 'customError',
} as const;

/** One of the well-known kinds, e.g. `'tooShort'`. */
export type ValidityKind = (typeof kinds)[keyof typeof kinds];

