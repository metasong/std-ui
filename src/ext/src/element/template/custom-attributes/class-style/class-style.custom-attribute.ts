// --- `class.name=${on}` / `style.prop=${value}`: bind one entry of the class/style attribute. -------
//
// Built only on std-ui's public custom-attribute API. Importing `@std-ui/ext` registers both (see `../register.ts`). The
// single modifier names the entry; everything else about the binding is validated here.

import { type CustomAttribute, type AttributeInfo, type Part } from '@std-ui/core';

type ApplyEntry = (el: Element, entry: string, value: unknown) => void;

/** Sets one entry of an attribute via `apply`. Re-applies only when the value changes. */
class EntryPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	constructor(
		private readonly el: Element,
		private readonly entry: string,
		private readonly apply: ApplyEntry,
	) {}
	update(values: readonly unknown[]): void {
		if (Object.is(values[0], this.#value)) return;
		this.#value = values[0];
		this.apply(this.el, this.entry, values[0]);
	}
}

/** An extension for plain attribute `name` (no sigil) whose single modifier is the entry to set. */
function singleEntryAttributeExtension(name: string, apply: ApplyEntry): CustomAttribute {
	return {
		sigil: '',
		name,
		single: true,
		matches: b => b.modifiers.length > 0 || b.arg !== undefined,
		validate(b: AttributeInfo) {
			if (b.arg !== undefined) throw new Error(`std-ui html: "${name}:${b.arg}" - ":arg" is not supported on ${name}.`);
			if (b.modifiers.length !== 1 || b.modifiers[0].value !== undefined) {
				throw new Error(`std-ui html: ${name} takes exactly one entry, e.g. ${name}.entry=\${value}.`);
			}
		},
		createPart: (el, b) => new EntryPart(el, b.modifiers[0].name, apply),
	};
}

/** `class.active=${on}`: toggles one class by truthiness. */
export const classAttributeExtension = singleEntryAttributeExtension('class', (el, entry, value) => {
	el.classList.toggle(entry, Boolean(value));
});

/** `style.color=${c}`: `setProperty` (kebab-case, `--custom` works); `null`/`undefined`/`false` removes it. */
export const styleAttributeExtension = singleEntryAttributeExtension('style', (el, entry, value) => {
	const style = (el as HTMLElement).style;
	if (value == null || value === false) style.removeProperty(entry);
	else style.setProperty(entry, String(value));
});