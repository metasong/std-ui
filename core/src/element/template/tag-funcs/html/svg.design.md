# Design: SVG support (`svg` tag)

## Problem

Templates are compiled by assigning markup to a `<template>` element's `innerHTML`. The HTML parser
decides an element's namespace **at creation time, from context**:

- Inside an `<svg>` start tag, the parser switches to *foreign content* mode, and every descendant is
  created as an SVG element (`SVGCircleElement`, namespace `http://www.w3.org/2000/svg`).
- Anywhere else, a tag such as `<circle>` or `<path>` is unknown to HTML, so the parser creates an
  `HTMLUnknownElement` in the XHTML namespace. The parser never guesses SVG from the tag name.

An element's class and namespace cannot change after creation. Moving an `HTMLUnknownElement` into a
live `<svg>` later does not convert it. It stays in the DOM with a 0x0 box, and the browser reports no
error.

So these two cases behave differently:

| Template | Result |
|---|---|
| `` t`<svg><circle r="${r}"/></svg>` `` | Works. `<svg>` is in the same string, so the parser enters SVG mode. |
| `` t`<circle r="${r}"/>` `` (a fragment) | Broken. Parsed as HTML, so it becomes `HTMLUnknownElement` (see below). |

### Why the fragment is broken

What the engine does with a template, step by step:

1. `t` returns the literal `strings` plus `values`. The compiler joins `strings` with marker text for each
   `${}` hole, giving a markup string such as `<circle r="__marker__"/>`.
2. It assigns that string to `template.innerHTML`. A `<template>` parses its contents with the HTML
   fragment parsing algorithm. The context element is `<template>`, which is an HTML element, so the
   parser starts in the **HTML namespace** ("in template" insertion mode).
3. The parser meets the start tag `circle`. In HTML insertion modes, the only tags that switch to the SVG
   namespace are `<svg>` itself (and `<math>` for MathML). `circle` is not one of them. The tag name is
   not a known HTML element, so the parser runs the "any other start tag" step. It creates a generic
   element in the **XHTML namespace**, an `HTMLUnknownElement` with `localName === 'circle'`.
4. Only a currently open `<svg>` element would make the parser treat the following tags as foreign
   content (SVG namespace, case-adjusted attributes such as `viewBox`). In the fragment there is no open
   `<svg>`, so this never happens.
5. `instantiate()` clones the parsed content with `importNode`. Cloning copies each element's
   namespace and class, so the clone is still an `HTMLUnknownElement`.
6. The clone is appended under a real `<svg>`. The DOM does not re-type it: namespace and interface are
   fixed at creation. For rendering, the browser only draws elements that implement the SVG interfaces
   (it checks the SVG namespace, not the tag name). The XHTML-namespace `circle` is therefore laid out as
   an unknown inline element with no box (measured 0x0), and no error is raised.

Two details are worth noting:

- **The parts still work.** The marker attribute and comment anchors are found and replaced normally,
  because that logic is namespace-independent. The template looks healthy in tests of parts and values,
  and only the element type is wrong. This is why the bug is silent.
- **Attribute handling also differs.** In SVG mode the parser adjusts attribute names (for example
  `viewbox` to `viewBox`). In the HTML namespace attribute names are lower-cased, so camelCase SVG
  attributes would also be wrong, even if the element type were not.

The `svg` tag fixes step 2 only: wrapping the markup in `<svg>` makes the open `<svg>` element exist in
step 4, so steps 3 to 6 run with the SVG namespace.

The second case matters when SVG is composed from parts: a reusable `const dot = ...`, or a loop such
as `items.map(...)` returning shapes interpolated into one shared `<svg>`.

## Design

`svg` is a tag function identical to `t`, except that it marks the result with `type: 'svg'`.

```ts
export function svg(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values, type: 'svg' };
}
```

The compiler (`compiler/compile.ts`) then gives the parser the missing context through two hooks:

1. `wrapMarkup(markup, 'svg')` returns `<svg>${markup}</svg>` before parsing, so the fragment is parsed in
   SVG mode.
2. `unwrapContent(content, 'svg')` moves the wrapper's children into the fragment and removes the
   wrapper. The elements are already created, so they keep their SVG namespace.

For `'html'` templates, both hooks do nothing, so there is no cost on the normal path.

The `svg` fragment is meant to be interpolated into a real `<svg>`. Inserted into a `<div>`, it has the
correct element type but is not drawn, because SVG shapes only render inside an `<svg>` viewport.

### Why it fits the engine

SVG handling lives entirely in `EngineHooks` (see `compiler/engine.ts`). The engine itself knows
nothing about SVG, which keeps the core generic. Removing `svg` support means deleting the tag
function, `TemplateType`, the two hooks, and their tests.

### Caching

The compiled-template cache is keyed by `strings` identity **and** template type. The same `strings`
compiled as `'html'` and as `'svg'` produce different templates, because the parsed DOM differs.

## Usage

```ts
import { t, svg, render } from '@std-ui/core';

// Composing shapes: use `svg` for the fragments.
const dot = (x: number) => svg`<circle r="20" cx="${x}" cy="40" />`;
render(t`<svg viewBox="0 0 240 80">${[40, 120, 200].map(dot)}</svg>`, container);

// A complete <svg> in one template: plain `t` is enough.
const icon = t`<svg viewBox="0 0 10 10"><path d="M0 0L10 10" /></svg>`;
```

## Alternatives considered

| Option | Verdict |
|---|---|
| **Remove `svg`; always write whole `<svg>` in one `t`** | Simplest, but you cannot split shapes into reusable templates or loops. |
| **Each fragment carries its own `<svg>` wrapper** (`` t`<svg><circle/></svg>` ``) | Works, but creates a nested `<svg>` per piece. Each nested `<svg>` is a separate viewport, so `x`, `y`, `viewBox` and sizing behave differently. |
| **Detect SVG tag names and use `createElementNS`** | The compiler would need a list of SVG tags, and it conflicts with parsing from a string. |
| **Wrap-and-unwrap behind an `svg` tag (chosen)** | Small, isolated, correct namespace, no nested viewports. |

## Limitations

- The author must choose `svg` for fragments. Forgetting it fails silently (empty render, no error).
- Passing markup that already starts with `<svg>` to `svg` yields `<svg><svg>...</svg></svg>` during
  parse. It is harmless, since only the temporary outer wrapper is removed, but it is not the intended use.
- A fragment rendered outside an `<svg>` is typed correctly but not drawn.
- MathML uses the same mechanism through the `math` tag (wrapper `<math>`, template type `'math'`), with the same limitations.

## Verification

- Unit tests in `compiler/compile.test.ts`:
  - plain `t` fragments become `HTMLUnknownElement` in the XHTML namespace, also after being moved into
    a real `<svg>`;
  - `svg` fragments become SVG-namespace elements with no leftover wrapper;
  - cache entries are separate per template type.
- Browser demo: the "SVG" section of the feature demo (`demo/pages/tour/sections/svg-section.ts`) shows
  both cases side by side. Plain `t` circles are 0x0 and `svg` circles are 40x40 and drawn. Layout size is
  only observable in a real browser, because jsdom has no layout.
