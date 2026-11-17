// --- Binding extensions: plug new binding extension into the compiler. -----------------------------
//
// The compiler parses every attribute name into the generic shape `sigil? name (:arg)? (.modifier[:value])*`
// and never decides what the pieces *mean*. An extension owns one `(sigil, name)` pair and gives the
// parts their meaning: it validates the binding at compile time and builds the `Part` at instantiate
// time. `class.active` / `style.color` are extensions (see `../extensions/class-style.ts`); a package
// like `std-ui-ext` can register more with `registerBindingExtension()`.
//
// Extensions must be registered before the templates that use them are first compiled (templates are
// cached by their `strings`), typically via a side-effect import.

import type { Modifier, Part } from '../parts/index.js';

/** A parsed attribute name, as handed to an extension. Static text only, case preserved. */
export interface BindingName {
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
export interface BindingValue {
	readonly literals: readonly string[];
	readonly valueCount: number;
}

export interface BindingExtension {
	readonly sigil: string;
	/** The attribute name, or `WILDCARD` for every name under `sigil`. */
	readonly name: string;
	/** Whether this extension handles `binding`; when it returns `false` the built-in handling
	 *  applies instead (e.g. plain `class=${x}` with no modifiers). Defaults to always. */
	matches?(binding: BindingName): boolean;
	/** `false` (default): the value may mix static text and several interpolations, e.g.
	 *  `#name="abc ${a} ${b}"`. Set `true` to require exactly one interpolation with no static text. */
	readonly single?: boolean;
	/** Compile-time validation; throw to reject the binding. */
	validate?(binding: BindingName): void;
	/** Builds the part for one instance of the template. `value` describes the attribute value; with
	 *  `single` it is always `['', '']` / `1`. */
	createPart(element: Element, binding: BindingName, host: unknown, value: BindingValue): Part;
}

/** As an extension's `name`: handles every name under its sigil, unless a specific extension matches first. */
export const WILDCARD = '*';

const registry = new Map<string, BindingExtension>();
const key = (sigil: string, name: string) => `${sigil}\0${name}`;

/** Registers (or replaces) the extension for its `(sigil, name)` pair. */
export function registerBindingExtension(extension: BindingExtension): void {
	registry.set(key(extension.sigil, extension.name), extension);
}

/** The extension handling `binding`: the exact `(sigil, name)` one if it matches, else the sigil's wildcard. */
export function findBindingExtension(binding: BindingName): BindingExtension | undefined {
	for (const name of [binding.name, WILDCARD]) {
		const extension = registry.get(key(binding.sigil, name));
		if (extension && (extension.matches?.(binding) ?? true)) return extension;
	}
	return undefined;
}
