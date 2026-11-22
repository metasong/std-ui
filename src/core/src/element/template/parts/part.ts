// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `factory.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

import { DEV } from '../../../dev/flag.js';

/**
 * The template positions a directive can be bound to: the discriminator of `PartInfo.type`, set by each
 * `Part` that accepts directives and shared with The factory for slot descriptors. Directives check
 * `partInfo.type` and throw if used somewhere they don't support, e.g. `classMap` requiring `ATTRIBUTE` + `name === 'class'`, or `html` requiring `CHILD`.
 */
export const PartType = {
	ATTRIBUTE: 'attribute',
	CHILD: 'child',
	ELEMENT: 'element',
} as const;
export type PartType = (typeof PartType)[keyof typeof PartType];

/** A parsed `.name[:value]` modifier from a binding name, e.g. `.once` or `.debounce:300`. */
export interface Modifier {
	name: string;
	value?: string;
}

const warned = new Set<string>();

/** DEV only: parts that interpret no modifiers call this so a stray `.modifier` isn't silently
 *  swallowed. Deduped by message, since a part is constructed once per template instance. */
export function warnIgnoredModifiers(binding: string, modifiers: readonly Modifier[] = [], known: readonly string[] = []): void {
	if (!DEV) return;
	for (const { name, value } of modifiers) {
		if (known.includes(name) && value === undefined) continue;
		const message = `std-ui html: unsupported modifier ".${name}${value === undefined ? '' : `:${value}`}" on "${binding}" was ignored.`;
		if (warned.has(message)) continue;
		warned.add(message);
		console.warn(message);
	}
}

/**
 * One dynamic position bound to a live DOM location. `valueCount` tells the caller (see
 * `updateParts()` below) how many consecutive entries of a template's `values[]` this part
 * consumes - `1` for every part except `AttributePart`, which may span several when an attribute's
 * value mixes static text with multiple interpolations, e.g. `class="${a} ${b}"`.
 */
export interface Part {
	readonly valueCount: number;
	/** Called with this part's slice of `values[]` (exactly `valueCount` entries): on the initial render
	 *  and again on every re-render of the owning template, normally via `updateParts()`. Also called
	 *  directly by renderers that own parts, e.g. list items and keyed rows (`part.update([value])`).
	 *  Implementations must no-op when the values are `Object.is`-equal to the previous ones. */
	update(values: readonly unknown[]): void;
	/** Optional: called when the part's content is torn down, so any bound directive's
	 *  `disconnected()` runs. */
	disconnect?(): void;
	/** Optional: removes any DOM the part added dynamically after instantiation (e.g. list items). */
	dispose?(): void;
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
