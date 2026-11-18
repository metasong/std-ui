// `formBind()` — `bind()` plus form UI. Value sync is core's `bind`; this plugin adds, for a state
// that has `check` / `formUi` (both optional, read structurally):
//   - validation errors → the element's constraint validation (`setCustomValidity` / `setErrors`)
//   - touched: focusout / invalid → `formUi.touched`; the state is shown as `:state(touched)` / `[touched]`
//   - effective readonly / disabled → the element (property, attribute and aria)

import { createBind, effect, type BindPlugin, type BindPluginContext } from '@std-ui/core';
import { markTouched, onTouch, unmarkTouched } from '../../../form/touched.js';
import type { FormUi } from '../../../../reactive/state/form-ui/index.js';
import type { ValidationError } from '../../../../reactive/state/check/index.js';

type ErrorReader = () => readonly ValidationError[];
type SettableErrors = Element & { setErrors(property: string, errors: readonly ValidationError[]): void };
type ValidityTarget = SettableErrors | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function hasSetErrors(element: Element): element is SettableErrors {
	return typeof (element as { setErrors?: unknown }).setErrors === 'function';
}

function isValidityTarget(element: Element): element is ValidityTarget {
	return (
		hasSetErrors(element) ||
		element instanceof HTMLInputElement ||
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement
	);
}

const uiOf = (source: unknown): FormUi | undefined => (source as { formUi?: FormUi } | null)?.formUi;
const errorsOf = (source: unknown): ErrorReader | undefined =>
	(source as { check?: { errors?: ErrorReader } } | null)?.check?.errors;

function report(element: ValidityTarget, property: string, errors: readonly ValidationError[]): void {
	if (hasSetErrors(element)) {
		element.setErrors(property, errors); // keeps the real flags and merges across bound properties
		return;
	}
	const message = errors.map((e) => e.message).filter(Boolean).join('\n');
	element.setCustomValidity(errors.length ? message || 'Invalid' : '');
}

/** Validation errors → element; returns a disposer that clears them. */
function wireErrors({ element, property, source }: BindPluginContext): () => void {
	if (!isValidityTarget(element)) return () => {};
	let reported = false;
	const apply = (errors: readonly ValidationError[]): void => {
		if (!errors.length && !reported) return; // nothing reported yet: skip the pointless clear
		reported = errors.length > 0;
		report(element, property, errors);
	};
	const stop = effect(() => apply(errorsOf(source())?.() ?? []));
	return () => {
		stop();
		apply([]);
	};
}

/** focusout / invalid → touched, and `formUi.touched` → the element's touched marker. */
function wireTouched({ element, source }: BindPluginContext): () => void {
	if (!isValidityTarget(element)) return () => {};
	const stopListening = onTouch(element, () => {
		const ui = uiOf(source());
		if (ui) ui.touch();
		else markTouched(element); // no `formUi`: the element alone remembers it
	});
	let shown = false;
	const stop = effect(() => {
		const touched = uiOf(source())?.touched();
		if (touched) {
			shown = true;
			markTouched(element);
		} else if (shown) {
			shown = false; // only undo what this state set
			unmarkTouched(element);
		}
	});
	return () => {
		stopListening();
		stop();
	};
}

type Lockable = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;

const isNativeControl = (el: Element): el is Lockable =>
	el instanceof HTMLInputElement ||
	el instanceof HTMLSelectElement ||
	el instanceof HTMLTextAreaElement ||
	el instanceof HTMLButtonElement;

function setInnerReadonly(host: Element, on: boolean): void {
	for (const el of host.querySelectorAll('input, textarea')) {
		if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.readOnly = on;
	}
}

function setInnerDisabled(host: Element, on: boolean): void {
	for (const el of host.querySelectorAll('input, textarea, select, button')) {
		if (isNativeControl(el)) el.disabled = on;
	}
}

function setReadonly(element: Element, on: boolean): void {
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.readOnly = on;
	else {
		element.toggleAttribute('readonly', on); // <select>, custom elements
		setInnerReadonly(element, on);
	}
	if (on) element.setAttribute('aria-readonly', 'true');
	else element.removeAttribute('aria-readonly');
}

function setDisabled(element: Element, on: boolean): void {
	if (isNativeControl(element)) element.disabled = on;
	else {
		element.toggleAttribute('disabled', on); // custom elements
		setInnerDisabled(element, on);
	}
	if (on) element.setAttribute('aria-disabled', 'true');
	else element.removeAttribute('aria-disabled');
}

/** Effective readonly / disabled → element; only undoes what this state applied. */
function wireLocks({ element, source }: BindPluginContext): () => void {
	let readonly = false;
	let disabled = false;
	const stop = effect(() => {
		const ui = uiOf(source());
		if (!ui) return;
		const ro = ui.readonly();
		const dis = ui.disabled();
		if (ro !== readonly) setReadonly(element, (readonly = ro));
		if (dis !== disabled) setDisabled(element, (disabled = dis));
	});
	return () => {
		stop();
		if (readonly) setReadonly(element, false);
		if (disabled) setDisabled(element, false);
	};
}

/** The form-UI plugin on its own, for composing with other `createBind` plugins. */
export const formUiPlugin: BindPlugin = (context) => {
	const stops = [wireErrors(context), wireTouched(context), wireLocks(context)];
	return () => stops.reverse().forEach((stop) => stop());
};

/**
 * `bind()` with form UI: validation errors, touched, readonly and disabled shown on the element.
 *
 * ```ts
 * const form = state({ name: '' }).with(check).with(formUi);
 * t`<input .value=${formBind(form.name)} />`
 * form.name.formUi.disabled.own.set(true); // input is disabled
 * ```
 */
export const formBind = createBind([formUiPlugin]);
