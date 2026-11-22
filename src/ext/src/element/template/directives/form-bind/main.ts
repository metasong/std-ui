// `formBind()` — `bind()` plus form UI. Value sync is core's `bind`; this plugin adds, for a state
// that has `check` / `formUi` (both optional, read structurally):
//   - validation errors → the element's constraint validation (`setCustomValidity` / `setErrors`),
//     `aria-invalid`, and the text of the element named by `aria-errormessage` (if the author set one)
//   - touched: focusout / invalid → `formUi.touched`; shown as `:state(touched)` / `[data-touched]`
//   - dirty: `changes.dirty` → `:state(dirty)` / `[data-dirty]`
//   - required: a validator with `flag: 'valueMissing'` (`required()`) on `check.validators` → `aria-required`
//   - pending: `check.pending.own` (async validators) → `:state(pending)` / `[data-pending]` and `aria-busy`
//   - effective readonly / disabled → the element (property, attribute and aria)

import { bind, createBind, effect, type BindPlugin, type BindPluginContext } from '@std-ui/core';
import { setFlag } from '../../../form/flags.js';
import type { FormUi } from '../../../../reactive/state-tree/form-ui/index.js';
import type { ValidationError } from '../../../../reactive/state-tree/check/index.js';

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

/** Validators carry the flag they report (`required()` → `valueMissing`); read structurally, tracked. */
const requiredOf = (source: unknown): (() => boolean) | undefined => {
	const validators = (source as { check?: { validators?: () => readonly { flag?: unknown }[] } } | null)?.check
		?.validators;
	return validators && (() => validators().some((v) => v.flag === 'valueMissing'));
};
const dirtyOf = (source: unknown): (() => boolean) | undefined =>
	(source as { changes?: { dirty?: () => boolean } } | null)?.changes?.dirty;
const pendingOf = (source: unknown): (() => boolean) | undefined =>
	(source as { check?: { pending?: { own?: () => boolean } } } | null)?.check?.pending?.own;

/**
 * `aria-invalid`, and the message text in the element `aria-errormessage` points to (the author
 * provides that element; nothing is created). Read back from the element, so errors from several
 * bound properties stay merged.
 */
function reflectAria(element: ValidityTarget): void {
	const control = element as unknown as HTMLInputElement;
	const invalid = !control.validity.valid;
	if (invalid) element.setAttribute('aria-invalid', 'true');
	else element.removeAttribute('aria-invalid');
	const id = element.getAttribute('aria-errormessage');
	if (!id) return;
	const root = element.getRootNode() as Document | ShadowRoot;
	const target = root.getElementById?.(id);
	if (target) target.textContent = invalid ? control.validationMessage : '';
}

/** Validation errors → element; returns a disposer that clears them. */
function wireErrors({ element, property, source }: BindPluginContext): () => void {
	if (!isValidityTarget(element)) return () => {};
	let reported = false;
	const apply = (errors: readonly ValidationError[]): void => {
		if (!errors.length && !reported) return; // nothing reported yet: skip the pointless clear
		reported = errors.length > 0;
		report(element, property, errors);
		reflectAria(element);
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
	const onTouch = () => {
		const ui = uiOf(source());
		if (ui) ui.touch();
		else setFlag(element, 'touched', true); // no `formUi`: the element alone remembers it
	};
	element.addEventListener('focusout', onTouch);
	element.addEventListener('invalid', onTouch);
	let shown = false;
	const stop = effect(() => {
		const touched = uiOf(source())?.touched();
		if (touched) {
			shown = true;
			setFlag(element, 'touched', true);
		} else if (shown) {
			shown = false; // only undo what this state set
			setFlag(element, 'touched', false);
		}
	});
	return () => {
		element.removeEventListener('focusout', onTouch);
		element.removeEventListener('invalid', onTouch);
		stop();
	};
}

/** A state flag → the element's marker (and `extra`, e.g. an aria attribute); only undoes what this state set. */
function wireFlag(
	flag: 'dirty' | 'pending',
	read: (source: unknown) => (() => boolean) | undefined,
	extra?: (element: Element, on: boolean) => void,
): (context: BindPluginContext) => () => void {
	return ({ element, source }) => {
		let shown = false;
		const apply = (on: boolean): void => {
			setFlag(element, flag, on);
			extra?.(element, on);
		};
		const stop = effect(() => {
			const on = read(source())?.() ?? false;
			if (on === shown) return;
			apply((shown = on));
		});
		return () => {
			stop();
			if (shown) apply(false);
		};
	};
}

/** A `valueMissing` validator (`required()`) → `aria-required` (a native `required` would add a second, native error). */
function wireRequired({ element, source }: BindPluginContext): () => void {
	let shown = false;
	const stop = effect(() => {
		const on = requiredOf(source())?.() ?? false;
		if (on === shown) return;
		shown = on;
		if (on) element.setAttribute('aria-required', 'true');
		else element.removeAttribute('aria-required');
	});
	return () => {
		stop();
		if (shown) element.removeAttribute('aria-required');
	};
}

const wireDirty = wireFlag('dirty', dirtyOf);
const wirePending = wireFlag('pending', pendingOf, (element, on) => {
	if (on) element.setAttribute('aria-busy', 'true');
	else element.removeAttribute('aria-busy');
});

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
	const stops = [wireErrors(context), wireTouched(context), wireDirty(context), wirePending(context), wireRequired(context), wireLocks(context)];
	return () => stops.reverse().forEach((stop) => stop());
};

/**
 * `bind()` with form UI: validation errors, touched, dirty, readonly and disabled shown on the element.
 *
 * ```ts
 * const form = stateTree({ name: '' }).with(check).with(formUi);
 * t`<input .value=${formBind(form.name)} />`
 * form.name.formUi.disabled.own.set(true); // input is disabled
 * ```
 */
export const formBind: typeof bind = createBind([formUiPlugin]);
