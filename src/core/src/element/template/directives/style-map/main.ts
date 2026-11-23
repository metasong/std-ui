import { Directive, directive, noChange, type AttributePartInfo, type PartInfo } from '../directive.js';
import { PartType } from '../../parts/part.js';
import { DEV } from '../../../../dev/flag.js';

/** `fontSize` -> `font-size`; CSS custom properties (`--foo`) and already-kebab/lowercase names
 *  pass through unchanged, matching `CSSStyleDeclaration.setProperty`'s expectations. */
export function toCssPropertyName(name: string): string {
	if (name.startsWith('--')) return name;
	return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

interface Declaration { value: string; priority: '' | 'important' }

/** Splits `text` on the `;` that end declarations, ignoring `;` inside parentheses (`url(data:...;base64,...)`)
 *  and quotes (`content: ";"`), which a plain `split(';')` would cut in half. */
export function splitDeclarations(text: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let quote = '';
	let start = 0;
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (quote) {
			if (ch === '\\') i++; // escaped char inside a string
			else if (ch === quote) quote = '';
		}
		else if (ch === '"' || ch === "'") quote = ch;
		else if (ch === '(') depth++;
		else if (ch === ')') depth = Math.max(0, depth - 1);
		else if (ch === ';' && depth === 0) {
			parts.push(text.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(text.slice(start));
	return parts;
}

const IMPORTANT_RE = /\s*!\s*important\s*$/i;

/** `setProperty` ignores a value that ends in `!important`; the priority must be its own argument. */
function splitPriority(value: string): { value: string; priority: '' | 'important' } {
	return IMPORTANT_RE.test(value) ? { value: value.replace(IMPORTANT_RE, ''), priority: 'important' } : { value, priority: '' };
}

/**
 * The `styleMap` directive: sets/removes individual inline style properties via
 * `el.style`, rather than recomputing the whole `style` attribute as a string. Keys may be
 * camelCase (`fontSize`) or kebab-case/custom properties (`font-size`, `--my-color`); values of
 * `null`/`undefined` remove that property, anything else is stringified.
 *
 * May be used as the attribute's only interpolation, or mixed with static CSS text/other
 * declarations (see `update()` below) - unlike `?`/`.`/`@`-prefixed bindings, which must be a
 * single bare interpolation since those bind a live value, not a composed string:
 *
 *   t`<div style="${styleMap({ color: 'red', fontSize: active ? '16px' : null })}border:2px solid #d1d5db;"></div>`
 */
class StyleMapDirective extends Directive {
	/** CSS property names this instance set last time, so the next `update()` knows which to remove
	 *  via `removeProperty` if they drop out or go nullish. */
	#previous: Set<string> | undefined;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.ATTRIBUTE || partInfo.name !== 'style') {
			throw new Error(DEV ? 'std-ui styleMap(): must be bound to a "style" attribute.' : 'styleMap(): style attribute only');
		}
	}

	/**
	 * Sets/removes only the properties that changed since last time via `part.element.style`, then
	 * signals there's nothing left to commit.
	 *
	 * If `part.staticText` is set (`styleMap()` is mixed with static CSS text/other declarations in
	 * the same `style` attribute - see `AttributePartInfo.staticText` in `../directive.js`), it's
	 * parsed as `prop:value;` declarations the same way a real `style` attribute would and merged
	 * with this call's own object (whose entries win on a clashing property name) before diffing,
	 * so neither contribution clobbers the other.
	 */
	override update(part: AttributePartInfo, styles: Readonly<Record<string, string | number | null | undefined>>): typeof noChange {
		// 1. Build the target map: static `style` text first, then this call's object (overrides on clash).
		const next = new Map<string, Declaration>();
		if (part.staticText) {
			for (const declaration of splitDeclarations(part.staticText)) {
				const colonIndex = declaration.indexOf(':');
				if (colonIndex === -1) continue;
				const prop = declaration.slice(0, colonIndex).trim();
				const value = declaration.slice(colonIndex + 1).trim();
				if (prop && value) next.set(prop, splitPriority(value));
			}
		}
		// `null`/`undefined`/`false` (e.g. `cond && {...}`) mean "no styles".
		if (styles && typeof styles === 'object') {
			for (const [key, value] of Object.entries(styles)) {
				if (value == null) continue;
				next.set(toCssPropertyName(key), splitPriority(String(value)));
			}
		}
		const element = part.element as HTMLElement | SVGElement;
		const previous = this.#previous;
		// 2. Set every property in `next` on the element.
		for (const [prop, { value, priority }] of next) element.style.setProperty(prop, value, priority);
		// 3. Remove properties this instance set last time but no longer want.
		if (previous) for (const prop of previous) if (!next.has(prop)) element.style.removeProperty(prop);
		// 4. Remember property names for the next diff; attribute commit is skipped via `noChange`.
		this.#previous = new Set(next.keys());
		return noChange;
	}
}

export const styleMap = directive(StyleMapDirective);
