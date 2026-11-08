// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `compile.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

/**
 * One dynamic position bound to a live DOM location. `valueCount` tells the caller (see
 * `updateParts()` below) how many consecutive entries of a template's `values[]` this part
 * consumes - `1` for every part except `AttributePart`, which may span several when an attribute's
 * value mixes static text with multiple interpolations, e.g. `class="${a} ${b}"`.
 */
export interface Part {
	readonly valueCount: number;
	update(values: readonly unknown[]): void;
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

export class PropertyPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		(this.el as unknown as Record<string, unknown>)[this.name] = value;
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
