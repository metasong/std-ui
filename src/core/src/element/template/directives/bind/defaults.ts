import { DEV } from '../../../../dev/flag.js';
import { isReadableState, isWritableState } from '../../../../reactive/signal/state.js';
import { kebab } from '../../../../util.js';
import { usageError } from '../../../../util.js';
// Element-aware defaults for `bind()`: which event, how to compare, how to coerce. Everything here
// is a pure function of (element, property), so `resolve.ts` can stay a simple "options ?? default".

export function isNativeValueElement(element: Element): boolean {
	return (
		element instanceof HTMLSelectElement ||
		element instanceof HTMLTextAreaElement ||
		element instanceof HTMLInputElement
	);
}

export function isCheckableInput(element: Element): element is HTMLInputElement {
	return (
		element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')
	);
}

export function isRadio(element: Element): element is HTMLInputElement {
	return element instanceof HTMLInputElement && element.type === 'radio';
}

export function describeTarget(element: Element, property: string): string {
	return `<${element.localName}>.${property}`;
}

export function readProperty(element: Element, property: string): unknown {
	const value = (element as unknown as Record<string, unknown>)[property];
	return isReadableState(value) ? value.get() : value;
}

/** A signal-valued property is written through its `.set()`; plain assignment would replace the signal itself. */
export function writeProperty(element: Element, property: string, model: unknown): void {
	const target = element as unknown as Record<string, unknown>;
	const current = target[property];
	if (isWritableState(current) && current !== model) current.set(model as never);
	else target[property] = model;
}

/** Native control events when applicable; otherwise `${kebab(property)}-change`. */
export function defaultEvent(element: Element, property: string): string {
	if (property === 'checked' && isCheckableInput(element)) return 'change';
	if (property === 'value') {
		if (element instanceof HTMLSelectElement) return 'change';
		if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return 'input';
	}
	return `${kebab(property)}-change`;
}

/** Live comparison: native controls compare in their own representation; everything else `Object.is`. */
export function defaultEquals(
	element: Element,
	property: string,
): (model: unknown, view: unknown) => boolean {
	if (property === 'checked' && isCheckableInput(element)) {
		return (a, b) => Boolean(a) === Boolean(b);
	}
	if (property === 'value' && isNativeValueElement(element)) {
		return (a, b) => String(a ?? '') === String(b ?? '');
	}
	return Object.is;
}

/** A numeric model bound to a native `.value` control stays a number. Custom conversions belong in
 *  `read` / `write`. */
export function defaultCoerce(
	element: Element,
	property: string,
): (view: unknown, currentModel: unknown) => unknown {
	if (property === 'value' && isNativeValueElement(element)) {
		return (view, current) => {
			if (typeof current === 'number' && typeof view === 'string' && view.trim() !== '') {
				const n = Number(view);
				if (!Number.isNaN(n)) return n;
			}
			return view;
		};
	}
	return view => view;
}

/** `.checked` on a plain <input> must be checkbox or radio (custom elements use `checked-change`). */
export function assertBindableTarget(element: Element, property: string): void {
	if (property === 'checked' && element instanceof HTMLInputElement && !isCheckableInput(element)) {
		throw usageError(DEV && `std-ui bind(): ${describeTarget(element, property)} requires type="checkbox" or type="radio".`, 'bind');
	}
}
