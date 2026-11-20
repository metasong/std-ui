// A tiny, app-agnostic tagged-template HTML design: tagged-template HTML with fine-grained,
// in-place DOM updates - no vdom diffing, no full re-parse/re-render per update.
//
// Usage:
//
//   const result = t`<div class=${cls}>${label}</div>`;
//   render(result, container);
//
// How it works (core trick):
//  1. `t` just captures `strings`/`values` - no DOM work happens yet. Tagged template calls
//     reuse the *same* `strings` array object across repeated calls at the same call site (this is
//     guaranteed by the JS spec), so it doubles as a cache key.
//  2. The first time `getTemplate()` needs a given `strings` (+ `'html'` vs `'svg'` type), we compile
//     once: scan/join the strings with marker text, parse via a `<template>`, then walk elements and
//     child-marker comments to record where each dynamic part landed (`nodeIndex` among those
//     nodes only). The compiled `Template` is cached in a `WeakMap` keyed by `strings` (per type).
//  3. When `render()` first binds a container to a template (or the container's `strings` identity
//     changes), we clone that compiled template once (`cloneNode`), resolve indices on the clone,
//     and create a `Part` (child/attribute/property/event/boolean-attribute) per dynamic position.
//  4. Later `render()` calls into the same container with the *same* `strings` reference skip compile,
//     clone, and part creation entirely - `render.ts` just calls `.update()` on the existing `Part`s.
//     Unchanged values are skipped when each part can tell nothing changed (e.g. `Object.is` on
//     `.`/ `?` bindings, string equality on composed attributes, renderer reuse in child positions).
//
// What's intentionally left out, as a deliberate scope choice: most directives (built-ins include `bind`,
// `classMap`, `styleMap`, `mapByKey`, `virtualize`, `html` (raw markup child directive) - see `./directives/` and
// `./index.js` exports, though `directives/directive.ts`'s `Directive`/`directive()`/`PartType` - modeled on
// the base class - is the generic extension point for more), and MathML template handling. Plain attributes (no
// `?`/`.`/`@` sigil) do support multi-expression/mixed-static values like `class="${a} ${b}"` or `class="static-${x}"`; the
// `?`/`.`/`@`-prefixed kinds don't, since they bind a real JS value rather than a string - each
// must be a single bare interpolation, e.g. `?hidden=${v}`. SVG is supported via `svg()` below,
// for the one case plain `t` can't handle: a namespace-less fragment (no `<svg>` wrapper of its
// own) meant to be interpolated as a child of an existing `<svg>` element.
//
// This module ties the pieces (compilation, parts, rendering) together; see sibling modules for
// each concern: `../../compiler/`, `../../parts/`, `../../render.ts`, `../../directives/directive.ts`.

/** The result of calling `t`/`svg` - inert until passed to `render()`. */
export interface TemplateResult {
	readonly strings: TemplateStringsArray;
	readonly values: readonly unknown[];
	/** `'svg'` for results from `svg\`...\``; tells `compile.ts` to parse the markup inside a
	 *  temporary `<svg>` wrapper so its elements land in the SVG namespace. Absent (`undefined`)
	 *  for plain `t` results. */
	readonly type?: 'svg' | 'math';
}

/**
 * create a std-ui html template.
*/
export function t(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values };
}

/**
 * svg parent tag and namespace wrapper for svg markup that's pure SVG content with no `<svg>` wrapper of its own - e.g. a
 * reusable snippet meant to be interpolated as a child of an existing `<svg>` element:
 *
 *   const dot = (r: number) => svg`<circle r=${r} />`;
 *   t`<svg viewBox="0 0 10 10">${dot(3)}</svg>`;
 *
 * If your markup already includes its own top-level `<svg>...</svg>`, plain `t` works fine - the parser assigns the SVG namespace as soon as it sees the `<svg>` tag, even inside a `<template>`.
 * `svg` is only needed for namespace-less fragments like the `<circle>` above.
 */
export function svg(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values, type: 'svg' };
}

/**
 * MathML counterpart of `svg`: for namespace-less MathML fragments (no `<math>` wrapper of their own) meant to be
 * interpolated as a child of an existing `<math>` element:
 *
 *   const term = (x: string) => math`<mi>${x}</mi>`;
 *   t`<math>${term('x')}<mo>+</mo>${term('y')}</math>`;
 *
 * A complete `<math>...</math>` works with plain `t`.
 */
export function math(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values, type: 'math' };
}

export function isTemplateResult(value: unknown): value is TemplateResult {
	return typeof value === 'object' && value !== null && 'strings' in value && 'values' in value;
}
