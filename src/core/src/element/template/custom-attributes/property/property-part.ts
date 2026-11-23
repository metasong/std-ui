import { DirectiveSlot, isDirectiveResult, noChange, type PropertyPartInfo } from '../../directives/directive.js';
import { PartType, type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';
import { writeProperty } from '../../directives/bind/defaults.js';

export class PropertyPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	readonly #slot = new DirectiveSlot();
	readonly #partInfo: PropertyPartInfo;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		modifiers?: readonly Modifier[],
	) {
		warnIgnoredModifiers(`.${name}`, modifiers);
		this.#partInfo = { type: PartType.ATTRIBUTE, element: el, name, property: true };
	}

	disconnect(): void {
		this.#slot.disconnect();
	}

	update(values: readonly unknown[]): void {
		const value = values[0];
		if (isDirectiveResult(value)) {
			const result = this.#slot.apply(this.#partInfo, value);
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
