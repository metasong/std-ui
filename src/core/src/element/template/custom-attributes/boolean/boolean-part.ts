import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';

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
