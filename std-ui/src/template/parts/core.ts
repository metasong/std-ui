// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `compile.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

import {
	applyDirective,
	isDirectiveResult,
	noChange,
	PartType,
	type Directive,
	type PropertyPartInfo,
} from '../directive.js';

/**
 * One dynamic position bound to a live DOM location. `valueCount` tells the caller (see
 * `updateParts()` below) how many consecutive entries of a template's `values[]` this part
 * consumes - `1` for every part except `AttributePart`, which may span several when an attribute's
 * value mixes static text with multiple interpolations, e.g. `class="${a} ${b}"`.
 */
export interface Part {
	readonly valueCount: number;
	update(values: readonly unknown[]): void;
	/** Optional: called when the part's content is torn down, so any bound directive's
	 *  `disconnected()` runs. */
	disconnect?(): void;
}

/** Feeds `values` to `parts` in document order, giving each part exactly the slice it declared via
 *  `valueCount`. Centralizing this bookkeeping here (rather than in every call site) is what lets
 *  `AttributePart` consume more than one value without the rest of the codebase knowing about it. */
export function updateParts(parts: readonly Part[], values: readonly unknown[]): void {
	let offset = 0;
	for (const part of parts) {
		part.update(values.slice(offset, offset + part.valueCount));
		offset += part.valueCount;
	}
}

export class BooleanAttributePart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.el.toggleAttribute(this.name, Boolean(value));
	}
}

/** `@state()`/`@attribute()` fields expose a read-only store; plain assignment would hit a getter-only accessor. */
function writeProperty(el: Element, name: string, value: unknown): void {
	const host = el as unknown as Record<string, unknown>;
	const current = host[name];
	if (
		typeof current === 'function'
		&& current !== value
		&& typeof (current as { set?: unknown }).set === 'function'
	) {
		(current as { set: (v: unknown) => void }).set(value);
		return;
	}
	host[name] = value;
}

export class PropertyPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	#directive: Directive | undefined;
	readonly #partInfo: PropertyPartInfo;
	constructor(
		private readonly el: Element,
		private readonly name: string,
	) {
		this.#partInfo = { type: PartType.PROPERTY, element: el, name };
	}

	disconnect(): void {
		this.#directive?.disconnected();
		this.#directive = undefined;
	}

	update(values: readonly unknown[]): void {
		const value = values[0];
		if (isDirectiveResult(value)) {
			const { instance, value: result } = applyDirective(this.#partInfo, value, this.#directive);
			this.#directive = instance;
			if (result === noChange) return;
			if (Object.is(result, this.#value)) return;
			this.#value = result;
			writeProperty(this.el, this.name, result);
			return;
		}
		this.disconnect();
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		writeProperty(this.el, this.name, value);
	}
}

export class EventPart implements Part {
	readonly valueCount = 1;
	#listener: EventListenerOrEventListenerObject | undefined;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		private readonly options?: AddEventListenerOptions,
	) {}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (value === this.#listener) return;
		// `removeEventListener` only needs `capture` to match the call that added the listener;
		// `once`/`passive` are ignored for removal purposes, but passing the same options is harmless.
		if (this.#listener) this.el.removeEventListener(this.name, this.#listener, this.options);
		this.#listener = typeof value === 'function' ? (value as EventListener) : undefined;
		if (this.#listener) this.el.addEventListener(this.name, this.#listener, this.options);
	}
}

/** <div ${directive()}>: an interpolation in an opening tag with no attribute name. Only
 *  directives (e.g. ef) make sense here; falsy values (cond && ref(r)) are ignored. */
export class ElementPart implements Part {
	readonly valueCount = 1;
	#directive: Directive | undefined;
	readonly #partInfo: ElementPartInfo;
	constructor(el: Element) {
		this.#partInfo = { type: PartType.ELEMENT, element: el };
	}

	disconnect(): void {
		this.#directive?.disconnected();
		this.#directive = undefined;
	}

	update(values: readonly unknown[]): void {
		const value = values[0];
		if (isDirectiveResult(value)) {
			this.#directive = applyDirective(this.#partInfo, value, this.#directive).instance;
			return;
		}
		this.disconnect();
		if (value != null && value !== false) {
			throw new Error('std-ui html: an element binding (<tag ${...}>) only accepts directives, e.g. ref().');
		}
	}
}