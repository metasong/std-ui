import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';

export class BooleanAttributePart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	readonly #el: Element;
	readonly #name: string;
	constructor(el: Element, name: string, modifiers?: readonly Modifier[]) {
		this.#el = el;
		this.#name = name;
		warnIgnoredModifiers(`?${name}`, modifiers);
	}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.#el.toggleAttribute(this.#name, Boolean(value));
	}
}
