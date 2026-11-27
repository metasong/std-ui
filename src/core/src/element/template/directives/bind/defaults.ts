import { isReadableState } from '../../../../reactive/signal/state.js';
import { kebab } from '../../../../util.js';
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
