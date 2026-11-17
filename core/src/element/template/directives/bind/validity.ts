// Validation bridge for `bind()`: when the bound state carries validators and the target is a form
// element, its errors are mirrored into the element's constraint validation (`setCustomValidity`
// for native controls, `setErrors` for `FormElement`). Everything validation-related lives here.

import { effect } from '../../../../reactive/index.js';
import { trackTouched } from '../../../../touched.js';
import type { BindValidationError as ValidationError, WritableSignal } from './types.js';

type ErrorReader = () => readonly ValidationError[];
/** Structural match for `FormElement` (lives in std-ui-ext), so core needn't import it. */
type SettableErrors = Element & { setErrors(property: string, errors: readonly ValidationError[]): void };

function hasSetErrors(element: Element): element is SettableErrors {
	return typeof (element as { setErrors?: unknown }).setErrors === 'function';
}

type ValidityTarget = SettableErrors | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isValidityTarget(element: Element): element is ValidityTarget {
	return (
		hasSetErrors(element) ||
		element instanceof HTMLInputElement ||
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement
	);
}

/** Returns the state's own-errors reader, or undefined for accessors / plain signals / non-form targets. */
export function errorReaderOf(source: WritableSignal, element: Element): ErrorReader | undefined {
	if (!isValidityTarget(element)) return undefined;
	return (source as { check?: { errors?: ErrorReader } }).check?.errors;
}

function report(element: ValidityTarget, property: string, errors: readonly ValidationError[]): void {
	const message = errors.map(e => e.message).filter(Boolean).join('\n');
	if (hasSetErrors(element)) {
		// Custom elements keep the real flags and merge errors across their bound properties.
		element.setErrors(property, errors);
	} else {
		// Native controls only expose `customError` to script; the message still carries the detail.
		element.setCustomValidity(errors.length ? message || 'Invalid' : '');
	}
}

/** Keeps `element`'s validity in sync with `read()`; returns a disposer that clears the error. */
export function wireValidity(element: Element, property: string, read: () => ErrorReader | undefined): () => void {
	if (!isValidityTarget(element)) return () => {};
	trackTouched(element);
	// Skip the pointless "no errors" write when nothing has been reported yet.
	let reported = false;
	const apply = (errors: readonly ValidationError[]): void => {
		if (!errors.length && !reported) return;
		reported = errors.length > 0;
		report(element, property, errors);
	};
	const stop = effect(() => apply(read()?.() ?? []));
	return () => {
		stop();
		apply([]);
	};
}
