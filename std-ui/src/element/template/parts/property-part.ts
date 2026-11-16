import { applyDirective, isDirectiveResult, noChange, type Directive, type PropertyPartInfo } from '../directives/directive.js';
import { PartType, type Modifier, type Part, warnIgnoredModifiers } from './part.js';

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
