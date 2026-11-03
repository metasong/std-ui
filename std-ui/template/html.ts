// A tiny, app-agnostic subset of lit-html's design: tagged-template HTML with fine-grained,
// in-place DOM updates - no vdom diffing, no full re-parse/re-render per update.
//
// Usage mirrors lit-html:
//
//   const result = html`<div class="${cls}">${label}</div>`;
//   render(result, container);
//
// How it works (same core trick as lit-html):
//  1. `html` just captures `strings`/`values` - no DOM work happens yet. Tagged template calls
//     reuse the *same* `strings` array object across repeated calls at the same call site (this is
//     guaranteed by the JS spec), so it doubles as a cache key.
//  2. The first time a given `strings` array is rendered, we compile it once: join the strings with
//     marker text, parse via a `<template>`, then walk the parsed tree to record where each dynamic
//     part landed (as a node index in document order, since `TreeWalker` visits nodes in the same
//     left-to-right order they were written in the markup). This compiled `Template` is cached
//     forever in a `WeakMap` keyed by `strings`.
//  3. Each render of a given container clones the compiled template's content once (cheap native
//     `cloneNode`), re-walks the clone with the same traversal to resolve the recorded indices back
//     to real nodes, and creates a `Part` (child/attribute/property/event/boolean-attribute) per
//     dynamic position.
//  4. On every subsequent render with the *same* `strings`, we skip steps 2-3 entirely and just call
//     `.update(value)` on each already-bound `Part` - only the values that actually changed touch
//     the DOM (`Part`s no-op on `Object.is`-equal values).
//
// What's intentionally left out, vs. real lit-html: keyed list reconciliation (`repeat()`),
// directives, SVG/MathML template handling, and multi-expression attributes (`class="${a} ${b}"`).
// Bindings must be single interpolations like `attr="${value}"`.
//
// This module ties the pieces (compilation, parts, rendering) together; see the sibling files for
// each concern: `compile.ts`, `parts.ts`, `unsafe-html.ts`, `render.ts`.

/** The result of calling `html` - inert until passed to `render()`. */
export interface TemplateResult {
	readonly strings: TemplateStringsArray;
	readonly values: readonly unknown[];
}

/** Tags a template literal as HTML to be rendered via `render()`. Does no DOM work itself. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values };
}

export function isTemplateResult(value: unknown): value is TemplateResult {
	return typeof value === 'object' && value !== null && 'strings' in value && 'values' in value;
}
