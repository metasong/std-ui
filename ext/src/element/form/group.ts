import { FormElement } from './element.js';
import { trackTouched } from '@std-ui/core';
import type { ValidationError } from '../../reactive/state/check/index.js';

/** An inner control that can own validity: another `FormElement` (or group) or a native control. */
export type ValidationErrorTarget = FormElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function applyValidationErrors(
	target: ValidationErrorTarget,
	property: string,
	errors: readonly ValidationError[],
): void {
	trackTouched(target);
	if (target instanceof FormElement) return target.setErrors(property, errors);
	// Native controls only expose `customError` to script.
	const message = errors.map(e => e.message).filter(Boolean).join('\n');
	target.setCustomValidity(errors.length ? message || 'Invalid' : '');
}

/**
 * A form-associated wrapper around inner controls. Errors of each bound property are routed to the
 * inner control returned by `validationErrorTarget(property)`, which keeps its own validity state and
 * bubble; properties without a target fall back to the merged host state + `validationAnchor`.
 */
export abstract class FormGroup extends FormElement {
	/** The inner control that owns the validity of bound property `property`. */
	validationErrorTarget?(property: string): ValidationErrorTarget | null | undefined;

	/** Inner controls currently holding routed errors, so they can be cleared when errors go away. */
	#routed = new Map<string, ValidationErrorTarget>();

	override setErrors(property: string, errors: readonly ValidationError[]): void {
		const previous = this.#routed.get(property);
		const target = this.validationErrorTarget?.(property) ?? undefined;
		if (previous && previous !== target) {
			applyValidationErrors(previous, property, []);
			this.#routed.delete(property);
		}
		if (target) {
			this.#routed.set(property, target);
			applyValidationErrors(target, property, errors);
			super.setErrors(property, []); // drop any merged entry for this property
		} else {
			super.setErrors(property, errors);
		}
	}

	/** Host validity plus every inner control that owns routed errors. */
	override checkValidity(): boolean {
		let valid = super.checkValidity();
		for (const target of this.#routed.values()) valid = target.checkValidity() && valid;
		return valid;
	}

	/**
	 * Reports the host and every routed control, so each one fires `invalid` (for custom styling or
	 * messages). The browser shows only one native bubble, so controls are reported last-to-first,
	 * leaving focus and the bubble on the first invalid one.
	 */
	override reportValidity(): boolean {
		let valid = true;
		for (const target of [...this.#routed.values()].reverse()) valid = target.reportValidity() && valid;
		return super.reportValidity() && valid;
	}
}
