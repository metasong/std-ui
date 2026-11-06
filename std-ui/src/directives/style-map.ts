import { Directive, directive, noChange, PartType, type AttributePartInfo, type PartInfo } from '../template/directive.js';

/** `fontSize` -> `font-size`; CSS custom properties (`--foo`) and already-kebab/lowercase names
 *  pass through unchanged, matching `CSSStyleDeclaration.setProperty`'s expectations. */
function toCssPropertyName(name: string): string {
	if (name.startsWith('--')) return name;
	return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Mirrors lit-html's `styleMap` directive: sets/removes individual inline style properties via
 * `el.style`, rather than recomputing the whole `style` attribute as a string. Keys may be
 * camelCase (`fontSize`) or kebab-case/custom properties (`font-size`, `--my-color`); values of
 * `null`/`undefined` remove that property, anything else is stringified.
 *
 * Must be the attribute's *only* interpolation, with no surrounding static text - same rule as
 * `?`/`.`/`@`-prefixed bindings, since this binds a live object, not a composed string:
 *
 *   html`<div style="${styleMap({ color: 'red', fontSize: active ? '16px' : null })}"></div>`
 */
class StyleMapDirective extends Directive {
	/** CSS property names this instance set last time, so the next `update()` knows which to remove
	 *  via `removeProperty` if they drop out or go nullish. */
	#previous: Set<string> | undefined;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.ATTRIBUTE || partInfo.name !== 'style') {
			throw new Error('std-ui styleMap(): must be bound to a "style" attribute.');
		}
	}

	/** Sets/removes only the properties that changed since last time via `part.element.style`, then
	 *  signals there's nothing left to commit. `styles`'s type here is what `directive()` infers
	 *  `styleMap`'s own argument type from - no separate `render()` needed just for that. */
	override update(part: AttributePartInfo, styles: Readonly<Record<string, string | number | null | undefined>>): typeof noChange {
		const style = (part.element as HTMLElement | SVGElement).style;
		const next = new Set<string>();
		for (const [key, value] of Object.entries(styles)) {
			if (value == null) continue;
			const prop = toCssPropertyName(key);
			next.add(prop);
			style.setProperty(prop, String(value));
		}
		if (this.#previous) for (const prop of this.#previous) if (!next.has(prop)) style.removeProperty(prop);
		this.#previous = next;
		return noChange;
	}
}

export const styleMap = directive(StyleMapDirective);
