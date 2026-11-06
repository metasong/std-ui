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
// most directives (only `classMap`/`styleMap` are built in, see `../directives/index.js`, though
// `directive.ts`'s `Directive`/`directive()`/`PartType` - modeled on lit-html's own - is a generic
// extension point for writing more), and MathML template handling. Plain attributes (no
// `?`/`.`/`@` sigil) do support
// multi-expression/mixed-static values like `class="${a} ${b}"` or `class="static-${x}"`; the
// `?`/`.`/`@`-prefixed kinds don't, since they bind a real JS value rather than a string - each
// must be a single bare interpolation, e.g. `?hidden="${v}"`. SVG is supported via `svg()` below,
// for the one case plain `html` can't handle: a namespace-less fragment (no `<svg>` wrapper of its
// own) meant to be interpolated as a child of an existing `<svg>` element.
//
// This module ties the pieces (compilation, parts, rendering) together; see the sibling files for
// each concern: `compile.ts`, `parts.ts`, `unsafe-html.ts`, `render.ts`.

/** The result of calling `html`/`svg` - inert until passed to `render()`. */
export interface TemplateResult {
	readonly strings: TemplateStringsArray;
	readonly values: readonly unknown[];
	/** `'svg'` for results from `svg\`...\``; tells `compile.ts` to parse the markup inside a
	 *  temporary `<svg>` wrapper so its elements land in the SVG namespace. Absent (`undefined`)
	 *  for plain `html` results. */
	readonly type?: 'svg';
}

/** Tags a template literal as HTML to be rendered via `render()`. Does no DOM work itself. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values };
}

/**
 * Like `html`, but for markup that's pure SVG content with no `<svg>` wrapper of its own - e.g. a
 * reusable snippet meant to be interpolated as a child of an existing `<svg>` element:
 *
 *   const dot = (r: number) => svg`<circle r="${r}" />`;
 *   html`<svg viewBox="0 0 10 10">${dot(3)}</svg>`;
 *
 * If your markup already includes its own top-level `<svg>...</svg>`, plain `html` works fine -
 * the parser assigns the SVG namespace as soon as it sees the `<svg>` tag, even inside a
 * `<template>`. `svg` is only needed for namespace-less fragments like the `<circle>` above.
 */
export function svg(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values, type: 'svg' };
}

export function isTemplateResult(value: unknown): value is TemplateResult {
	return typeof value === 'object' && value !== null && 'strings' in value && 'values' in value;
}
