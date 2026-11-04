# `html.ts` usage

A tiny, app-agnostic subset of [lit-html](https://lit.dev/docs/libraries/standalone-templates/)'s
design: tagged-template HTML with fine-grained, in-place DOM updates. No vdom diffing, no
re-parsing or re-rendering the whole subtree on every update - only the values that actually
changed touch the DOM.

```ts
import { html, render } from './index.js';

const greeting = (name: string) => html`<p>Hello, <strong>${name}</strong>!</p>`;

render(greeting('Ada'), document.body); // creates the DOM once
render(greeting('Grace'), document.body); // reuses it, only patches the text node
```

## Binding kinds

Each `${...}` interpolation is bound based on *where* it appears in the markup:

| Where | Syntax | Binds to |
|---|---|---|
| Between tags | `<div>${value}</div>` | Child content (see below) |
| Plain attribute | `id="${value}"` | `el.setAttribute('id', String(value))` (removed if `value == null`) |
| `?`-prefixed attribute | `?hidden="${value}"` | `el.toggleAttribute('hidden', Boolean(value))` |
| `.`-prefixed attribute | `.value="${value}"` | `el.value = value` (a JS property, not an HTML attribute) |
| `@`-prefixed attribute | `@click="${handler}"` | `el.addEventListener('click', handler)` |

Child content accepts:

- `string` / `number` → rendered as a text node.
- `null` / `undefined` / `false` → renders nothing (clears any previous content).
- Another `html` result → rendered as a nested template, diffed independently.
- `unsafeHTML(markup)` → parses `markup` as HTML and inserts the resulting nodes directly (the one
  escape hatch for already-HTML strings, e.g. an SVG icon loaded via `?raw` - mirrors lit-html's
  `unsafeHTML` directive). Caller is responsible for the markup being trusted.
- An array of any of the above → rendered as a sibling list (not keyed - see Limitations).

```ts
html`
	<button ?disabled="${isLoading}" @click="${onSubmit}">
		${isLoading ? html`<spinner-icon></spinner-icon>` : 'Submit'}
	</button>
	<ul>${items.map(item => html`<li>${item.label}</li>`)}</ul>
`;
```

## Embedding templates

Build reusable markup as functions (or variables) that return `html` results, then interpolate them
as child content in a parent template. The nested part keeps its own compiled template and updates
in place when you re-render with the same inner call site:

```ts
import { html, render } from './index.js';

const badge = (label: string) => html`<span class="badge">${label}</span>`;
const statusRow = (label: string) => html`<p>Status: ${badge(label)}</p>`;

const container = document.createElement('div');
render(statusRow('ok'), container);
render(statusRow('fail'), container); // same DOM; only the badge text changes
```

There is no separate “include” API—composition is just `${nestedHtmlResult}` between tags.

## Logic: conditionals and lists

Use ordinary JavaScript in `${...}` to pick or build child content. The parent `` html`...` ``
call site stays the same; only the bound values change between renders.

**If / else (different template parts):**

```ts
const success = (msg: string) => html`<p class="ok">${msg}</p>`;
const error = (msg: string) => html`<p class="err">${msg}</p>`;

const alert = (ok: boolean, msg: string) =>
	html`<section>${ok ? success(msg) : error(msg)}</section>`;

// or with an if statement before the parent template:
function alertBody(ok: boolean, msg: string) {
	if (ok) return success(msg);
	return error(msg);
}
const alertFromIf = (ok: boolean, msg: string) => html`<section>${alertBody(ok, msg)}</section>`;
```

Each branch returns a different `` html`...` `` (different call sites). The nested `ChildPart`
swaps them by tearing down the old subtree and mounting the new one. The outer `<section>` wrapper
is unchanged if `alert` / `alertFromIf` always uses the same parent literal.

**Lists (`.map()` or a `for` loop):**

```ts
const row = (label: string) => html`<li>${label}</li>`;

html`<ul>${items.map(item => row(item.label))}</ul>`;

const rows = [];
for (const item of items) rows.push(row(item.label));
html`<ul>${rows}</ul>`;
```

Arrays are diffed by index (not keyed)—see Limitations.

## `render(result, container)`

Renders `result` into `container`. Call it again with a new `result` from the *same* tagged-template
call site (literally the same `html\`...\`` expression in source, evaluated with new values) and it
reuses the previous DOM, updating only the parts whose value changed:

```ts
function view(state: State) {
	return html`<div class="${state.open ? 'open' : ''}">${state.label}</div>`;
}

render(view(a), container); // builds DOM
render(view(b), container); // same call site -> patches class + text in place
```

Switching to a *different* template literal (e.g. a different `if` branch returning a different
`html\`...\`` string) tears down the old DOM and builds fresh - there's no cross-template diffing.

## Using it in a `UIElement`

`../component.ts`'s `UIElement.template()` hook accepts either style: sync the DOM imperatively
and return nothing (as existing components do), or return an `html` result and it's rendered into
the element automatically - same hook, same schedule, your choice per component. Read whatever
signal(s) you need directly inside `template()`:

```ts
import { element, html, UIElement } from '../index.js';

@element('hello-banner')
class HelloBanner extends UIElement {
	override template() {
		return html`<p>Hello, ${userName()}!</p>`;
	}
}
```

## How it works

1. `html` just captures `strings`/`values` — no DOM work happens yet. Tagged template calls reuse
   the *same* `strings` array object across repeated calls at the same call site (guaranteed by the
   JS spec), so it doubles as a cache key.
2. The first time a given `strings` array is rendered, it's compiled once: the strings are joined
   with marker text, parsed via a `<template>`, then the parsed tree is walked to record where each
   dynamic part landed (as a node index in document order, since `TreeWalker` visits nodes in the
   same left-to-right order they were written in the markup). The compiled template is cached
   forever in a `WeakMap` keyed by `strings`.
3. Each render into a given container clones the compiled template's content once (native
   `cloneNode`), re-walks the clone with the same traversal to resolve the recorded indices back to
   real nodes, and creates a `Part` (child/attribute/property/event/boolean-attribute) per dynamic
   position.
4. On every later render with the *same* `strings`, steps 2-3 are skipped entirely - just
   `.update(value)` on each already-bound `Part`, which no-ops on `Object.is`-equal values.

## Limitations (vs. real lit-html)

- **No keyed list reconciliation** (no `repeat()`/`map()` with keys). Arrays are diffed
  positionally: index 0 always updates the first rendered item, etc. Reordering a list re-renders
  items in place rather than moving DOM nodes - fine for appending/removing at the end, surprising
  for reordering/insertion in the middle.
- **No directives** (`classMap`, `styleMap`, `ref`, etc.) - just the five binding kinds above.
- **One interpolation per attribute.** `class="${a} ${b}"` or `class="static ${dynamic}"` are not
  supported - an attribute's value must be exactly one `${...}`. Combine multiple pieces into a
  single string yourself before interpolating:

  ```ts
  html`<div class="${`${a} ${b}`}">`;
  // or, more readably:
  const cls = `static-${dynamic}`;
  html`<div class="${cls}">`;
  ```
- **No MathML support.** There's no `mathml` tag function analogous to `svg` below.
- **SVG needs the `svg` tag for namespace-less fragments.** Markup containing its own top-level
  `<svg>...</svg>` works fine with plain `html` - the parser assigns the SVG namespace as soon as
  it sees the `<svg>` tag, even inside a `<template>`. But a reusable snippet meant to be
  interpolated as a *child* of an existing `<svg>` (e.g. `html`<circle r="${r}" />`` with no
  wrapping `<svg>`) would parse as an unnamespaced, non-rendering element - use `svg` instead:

  ```ts
  import { html, svg, render } from './index.js';

  const dot = (r: number) => svg`<circle r="${r}" />`;
  render(html`<svg viewBox="0 0 10 10">${dot(3)}</svg>`, container);
  ```
