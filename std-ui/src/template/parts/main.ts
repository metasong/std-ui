// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `compile.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

import { DEV } from '../../dev/index.js';
import {
	applyDirective,
	isDirectiveResult,
	noChange,
	PartType,
	type Directive,
	type ElementPartInfo,
	type PropertyPartInfo,
} from '../directive.js';

/** A parsed `.name[:arg]` modifier from a binding name, e.g. `.once` or `.debounce:300`. */
export interface Modifier {
	name: string;
	arg?: string;
}

const warned = new Set<string>();

/** DEV only: parts that interpret no modifiers call this so a stray `.modifier` isn't silently
 *  swallowed. Deduped by message, since a part is constructed once per template instance. */
export function warnIgnoredModifiers(binding: string, modifiers: readonly Modifier[] = [], known: readonly string[] = []): void {
	if (!DEV) return;
	for (const { name, arg } of modifiers) {
		if (known.includes(name) && arg === undefined) continue;
		const message = `std-ui html: unsupported modifier ".${name}${arg === undefined ? '' : `:${arg}`}" on "${binding}" was ignored.`;
		if (warned.has(message)) continue;
		warned.add(message);
		console.warn(message);
	}
}

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
	constructor(private readonly el: Element, private readonly name: string, modifiers?: readonly Modifier[]) {
		warnIgnoredModifiers(`?${name}`, modifiers);
	}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.el.toggleAttribute(this.name, Boolean(value));
	}
}

/** A store-valued field (`state(...)`) is written through its `.set()`; plain assignment would replace the store itself. */
function writeProperty(el: Element, name: string, value: unknown): void {
	const host = el as unknown as Record<string, unknown>;
	const current = host[name];
	if (
		typeof current === 'function'
		&& current !== value
		&& typeof (current as { set?: unknown }).set === 'function'
	) {
		(current as unknown as { set: (v: unknown) => void }).set(value);
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
		modifiers?: readonly Modifier[],
	) {
		warnIgnoredModifiers(`.${name}`, modifiers);
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

/** <div ${directive()}>: an interpolation in an opening tag with no attribute name. Only
 *  directives (e.g. 
ef) make sense here; falsy values (cond && ref(r)) are ignored. */
export class ElementPart implements Part {
	readonly valueCount = 1;
	#directive: Directive | undefined;
	readonly #partInfo: ElementPartInfo;
	constructor(el: Element, host?: unknown) {
		this.#partInfo = { type: PartType.ELEMENT, element: el, host };
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