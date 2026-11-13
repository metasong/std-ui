import { UIElement } from '../ui-element.js';
import { markTouched, trackTouched } from './touched.js';
import type { ValidationError } from '../signal/signal-state/index.js';

/**
 * Form-associated variant of `UIElement` backed by `ElementInternals`.
 * Subclasses override `validate()` to return a validity result; it runs on connect and whenever
 * `value` changes via `setValue()` / `revalidate()`, and is reflected into the native constraint
 * validation API (`checkValidity()`, `reportValidity()`, `:invalid`, form submission blocking).
 *
 * ```ts
 * @tag('my-input')
 * class MyInput extends FormElement {
 *   protected override validate() {
 *     return this.value ? null : { flags: { valueMissing: true }, message: 'Required' };
 *   }
 * }
 * ```
 */
export interface ValidationResult {
	flags: ValidityStateFlags;
	message?: string;
	anchor?: HTMLElement;
}

/**
 * One validation message for errors keyed by bound property. With several properties the messages
 * are grouped under their name, indented:
 *   start:
 *     Start required
 *   end:
 *     End required
 * A single property keeps plain lines.
 */
function getMessage(errorsByProperty: ReadonlyMap<string, readonly ValidationError[]>): string {
	const grouped = errorsByProperty.size > 1;
	const lines: string[] = [];
	for (const [property, errors] of errorsByProperty) {
		const messages = errors.map(e => e.message).filter(Boolean);
		if (!messages.length) continue;
		if (grouped) lines.push(`${property}:`, ...messages.map(m => `  ${m}`));
		else lines.push(...messages);
	}
	return lines.join('\n');
}

export abstract class FormElement extends UIElement {
	static readonly formAssociated = true;

	readonly internals: ElementInternals = this.attachInternals();
	#value: File | string | FormData | null = null;

	/** Return `null`/`undefined` when valid, or a `ValidationResult` describing the failure. */
	protected validate?(): ValidationResult | null | undefined | void;

	/**
	 * The inner element that receives focus / the validation bubble when this element is invalid
	 * (`ElementInternals` takes a single anchor). Override with a getter; defaults to the host itself.
	 */
	get validationAnchor(): HTMLElement | null {
		return null;
	}

	get value(): File | string | FormData | null {
		return this.#value;
	}
	set value(v: File | string | FormData | null) {
		this.setValue(v);
	}

	get form(): HTMLFormElement | null { return this.internals.form; }
	get validity(): ValidityState { return this.internals.validity; }
	get validationMessage(): string { return this.internals.validationMessage; }
	get willValidate(): boolean { return this.internals.willValidate; }

	checkValidity(): boolean { return this.internals.checkValidity(); }
	reportValidity(): boolean {
		markTouched(this);
		return this.internals.reportValidity();
	}

	/** Sets the form value and re-runs `validate()`. */
	setValue(value: File | string | FormData | null, state?: File | string | FormData | null): void {
		this.#value = value;
		this.internals.setFormValue(value, state);
		this.revalidate();
	}

	/**
	 * Errors reported per bound property (by `bind()`); merged into one validity state:
	 * flags are unioned, messages joined, anchor is `validationAnchor`.
	 * While any exist they take precedence over `validate()`.
	 */
	#validationErrors = new Map<string, readonly ValidationError[]>();

	/** Sets (or, with an empty list, clears) the errors of one property and re-applies validity. */
	setErrors(property: string, errors: readonly ValidationError[]): void {
		if (errors.length) this.#validationErrors.set(property, errors);
		else this.#validationErrors.delete(property);
		this.revalidate();
	}

	#applyValidationErrors(): void {
		const flags: ValidityStateFlags = {};
		for (const errors of this.#validationErrors.values()) {
			for (const { flag } of errors) flags[flag] = true;
		}
		const message = getMessage(this.#validationErrors);
		this.internals.setValidity(flags, message || undefined, this.validationAnchor ?? undefined);
	}

	/** Runs `validate()` (or applies per-property validation errors) and writes the outcome into `ElementInternals`. */
	revalidate(): void {
		if (this.#validationErrors.size) return this.#applyValidationErrors();
		const result = this.validate?.();
		if (result) {
			this.internals.setValidity(result.flags, result.message, result.anchor ?? this.validationAnchor ?? undefined);
		} else {
			this.internals.setValidity({});
		}
	}

	protected override connect(): void {
		trackTouched(this);
		this.revalidate();
	}

	formResetCallback(): void { this.setValue(null); }
}
