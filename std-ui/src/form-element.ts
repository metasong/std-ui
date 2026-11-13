import { UIElement } from './ui-element.js';

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

export abstract class FormElement extends UIElement {
	static readonly formAssociated = true;

	readonly internals: ElementInternals = this.attachInternals();
	#value: File | string | FormData | null = null;

	/** Return `null`/`undefined` when valid, or a `ValidationResult` describing the failure. */
	protected validate?(): ValidationResult | null | undefined | void;

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
	reportValidity(): boolean { return this.internals.reportValidity(); }

	/** Sets the form value and re-runs `validate()`. */
	setValue(value: File | string | FormData | null, state?: File | string | FormData | null): void {
		this.#value = value;
		this.internals.setFormValue(value, state);
		this.revalidate();
	}

	/** Runs `validate()` and writes the outcome into `ElementInternals`. */
	revalidate(): void {
		const result = this.validate?.();
		if (result) {
			this.internals.setValidity(result.flags, result.message, result.anchor);
		} else {
			this.internals.setValidity({});
		}
	}

	/** Custom error independent of `validate()`; pass '' to clear (re-runs `validate()`). */
	setCustomError(message: string): void {
		if (message) this.internals.setValidity({ customError: true }, message);
		else this.revalidate();
	}

	protected override connect(): void {
		this.revalidate();
	}

	formResetCallback(): void { this.setValue(null); }
}
