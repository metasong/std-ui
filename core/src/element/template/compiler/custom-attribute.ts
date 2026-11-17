// --- Custom attributes: plug new custom attribute into the compiler. -----------------------------
//
// The compiler parses every attribute name into the generic shape `sigil? name (:arg)? (.modifier[:value])*`
// and never decides what the pieces *mean*. An extension owns one `(sigil, name)` pair and gives the
// parts their meaning: it validates the binding at compile time and builds the `Part` at instantiate
// time. `class.active` / `style.color` are extensions (see `std-ui-ext custom-attributes/class-style.custom-attribute.ts`); a package
// like `@std-ui/ext` can register more with `registerCustomAttribute()`.
//
// Extensions must be registered before the templates that use them are first compiled (templates are
// cached by their `strings`), typically via a side-effect import.

import type { Modifier, Part } from '../parts/index.js';

/** A parsed attribute name, as handed to an extension. Static text only, case preserved. */
export interface AttributeInfo {
	/** The leading sigil: `''` (plain attribute), `'.'`, `'?'`, `'@'`, or any registered custom one. */
	sigil: string;
	/** The name without sigil, `:arg` and modifiers, e.g. `class` in `class.active`. */
	name: string;
	/** `name:arg`; reserved for extensions, built-in bindings reject it. */
	arg?: string;
	/** `.modifier[:value]`s in source order. */
	modifiers: readonly Modifier[];
}

/** The attribute value's shape: static text around each interpolation (`literals.length === valueCount + 1`). */
export interface AttributeValue {
	readonly literals: readonly string[];
	readonly valueCount: number;
}

export interface CustomAttribute {
	readonly sigil: string;
	/** The attribute name, or `WILDCARD` for every name under `sigil`. */
	readonly name: string;
	/** Whether this extension handles `attributeInfo`; when it returns `false` the built-in handling
	 *  applies instead (e.g. plain `class=${x}` with no modifiers). Defaults to always.
	 *  A specific-name extension that declines falls through to the sigil's `WILDCARD` extension. */
	matches?(attributeInfo: AttributeInfo): boolean;
	/** `false` (default): the value may mix static text and several interpolations, e.g.
	 *  `#name="abc ${a} ${b}"`. Set `true` to require exactly one interpolation with no static text. */
	readonly single?: boolean;
	/** Compile-time validation; throw to reject the binding. */
	validate?(attributeInfo: AttributeInfo): void;
	/** Builds the part for one instance of the template. `value` describes the attribute value; with
	 *  `single` it is always `['', '']` / `1`. */
	createPart(element: Element, attributeInfo: AttributeInfo, host: unknown, value: AttributeValue): Part;
}

/** As an extension's `name`: handles every name under its sigil, unless a specific extension matches first. */
export const WILDCARD = '*';

const registry = new Map<string, CustomAttribute>();
const key = (sigil: string, name: string) => `${sigil}\0${name}`;

/** Registers (or replaces) the extension for its `(sigil, name)` pair. */
export function registerCustomAttribute(extension: CustomAttribute): void {
	registry.set(key(extension.sigil, extension.name), extension);
}

/** The extension handling `attributeInfo`: the exact `(sigil, name)` one if it matches, else the sigil's wildcard. */
export function findCustomAttribute(attributeInfo: AttributeInfo): CustomAttribute | undefined {
	for (const name of [attributeInfo.name, WILDCARD]) {
		const extension = registry.get(key(attributeInfo.sigil, name));
		if (extension && (extension.matches?.(attributeInfo) ?? true)) return extension;
	}
	return undefined;
}
