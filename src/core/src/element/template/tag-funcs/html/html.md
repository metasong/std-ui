# `html.ts` usage

A tiny, app-agnostic subset of the template engine's
design: tagged-template HTML with fine-grained, in-place DOM updates. No vdom diffing, no
re-parsing or re-rendering the whole subtree on every update - only the values that actually
changed touch the DOM.

```ts
import { t, render } from './index.js';

const greeting = (name: string) => t`<p>Hello, <strong>${name}</strong>!</p>`;

render(greeting('Ada'), document.body); // creates the DOM once
render(greeting('Grace'), document.body); // reuses it, only patches the text node
```

## Binding kinds

Each `${...}` interpolation is bound based on *where* it appears in the markup:

| Where | Syntax | Binds to |
|---|---|---|
| Between tags | `<div>${value}</div>` | Child content (see below) |
| Plain attribute | `id=${value}` | `el.setAttribute('id', String(value))` (removed if `value == null`) |
| `?`-prefixed attribute | `?hidden=${value}` | `el.toggleAttribute('hidden', Boolean(value))` |
| `.`-prefixed attribute | `.value=${value}` | `el.value = value` (a JS property, not an HTML attribute) |
| `@`-prefixed attribute | `@click=${handler}` | `el.addEventListener('click', handler)` |
| `@`-prefixed attribute with modifiers | `@click.once.capture.passive=${handler}` | `el.addEventListener('click', handler, { once: true, capture: true, passive: true })` |
| `class.` entry | `class.active=${on}` | `el.classList.toggle('active', Boolean(on))` |
| `style.` entry | `style.color=${value}` | `el.style.setProperty('color', value)` (removed if `value` is `null`/`undefined`/`false`) |

### Event modifiers

Chain modifiers onto the event name, in any order and any subset:

| Modifier | Effect |
|---|---|
| `.capture`, `.once`, `.passive` | Passed to `addEventListener`'s options object, e.g. `@scroll.once.passive=${h}` |
| `.prevent` | `event.preventDefault()` before the handler runs |
| `.stop` | `event.stopPropagation()` before the handler runs |
| `.stop-immediate` | `event.stopImmediatePropagation()`; also blocks later listeners on the same element |
| `.self` | Skips events whose `target` isn't the element itself (ignores bubbled events from descendants) |

```ts
t`<form @submit.prevent=${save}>
  <button @click.stop.once=${track}>Save</button>
</form>`;
```

Unknown modifiers have no effect; in dev builds a one-time `console.warn` names the binding and
the modifier. Modifiers on a binding kind that takes none (`?hidden.foo`, `.value.bar`, plain
attributes) are ignored the same way.

### `class.` and `style.` entries (`@std-ui/ext`)

These two bindings come from `@std-ui/ext`: `import '@std-ui/ext'` registers them (before the templates that use them are first compiled).

`class.name=${bool}` toggles a single class and `style.prop=${value}` sets a single style
property, without touching the rest of `class`/`style`.

```ts
t`<button class="btn" class.active=${isActive} class.disabled=${!enabled}
          style.color=${color} style.--gap=${gap} style.display=${visible && 'block'}>
  Save
</button>`;
// isActive = true, enabled = true, color = 'red', gap = '4px', visible = false
// -> <button class="btn active" style="color: red; --gap: 4px;">
``` Use kebab-case for style properties;
custom properties work (`style.--gap=${v}`). Like `?`/`.`/`@` bindings, each takes exactly one
interpolation with no static text. The entry is the binding's single modifier; `name:arg` is reserved and throws at compile time. Prefer these over [`classMap`/`styleMap`](./directives/README.md)
when you only toggle a few known names; use the directives for dynamic key sets.

The full binding-name grammar (`[sigil]name[:arg](.modifier[:value])*`) is in
[`compiler/compile-attributes.md`](./compiler/compile-attributes.md#binding-name-grammar).

A plain attribute's value may mix static text with any number of interpolations - they're joined
into one string and re-applied via `setAttribute` whenever any piece changes:

```ts
t`<div class="${a} ${b}">`; // multiple interpolations
t`<div class="static-${dynamic}">`; // static text + one interpolation
```

`?`/`.`/`@`-prefixed bindings don't support this - they bind to a real JS value (a boolean, a
property, a listener), not a string, so each must be exactly one interpolation with no static text
(e.g. `?hidden=${v}`, not `?hidden="${a}${b}"` or `?hidden="x${v}"`); mixing either throws at
compile time.

Child content accepts:

- `string` / `number` → rendered as a text node.
- `null` / `undefined` / `false` → renders nothing (clears any previous content).
- Another `t` result → rendered as a nested template, diffed independently.
- `unsafeHtml(markup)` → parses `markup` as HTML and inserts the resulting nodes directly (the one
  escape hatch for already-HTML strings, e.g. an SVG icon loaded via `?raw`
  `html` directive). Caller is responsible for the markup being trusted. Itself a built-in
  **directive** (see [Directives](#directives) below) bound to the child position.
- An array of any of the above → rendered as a sibling list (not keyed - see Limitations).

A plain, bare attribute binding (single interpolation, no static text, e.g. `class=${...}`)
accepts an **attribute directive** - a value that applies itself directly to the element instead of
being stringified. `classMap()`/`styleMap()` are the two built in. A child-content position accepts
a **child directive** - `unsafeHtml()` is the one built in. See [Directives](#directives) below.

```ts
t`
	<button ?disabled=${isLoading} @click=${onSubmit}>
		${isLoading ? t`<spinner-icon></spinner-icon>` : 'Submit'}
	</button>
	<ul>${items.map(item => t`<li>${item.label}</li>`)}</ul>
`;
```

## Directives

Neither `AttributePart` nor `ChildPart` (in `parts/`) has built-in knowledge of any specific
directive. Instead both recognize one generic protocol, defined in `directives/directive.ts` and modeled on
Custom directives (trimmed to the
two binding kinds this engine actually produces - a bare attribute binding, or a child-content
position; no async/`ElementPart`/boolean-attribute/property/event directives):

```ts
export const PartType = {
	ATTRIBUTE: 'attribute', PROPERTY: 'property', CHILD: 'child', ELEMENT: 'element',
} as const;

export interface AttributePartInfo {
	readonly type: typeof PartType.ATTRIBUTE;
	readonly element: Element;
	readonly name: string;
}
export interface ChildPartInfo {
	readonly type: typeof PartType.CHILD;
	readonly anchor: Comment;
}
export type DirectivePart = AttributePartInfo | ChildPartInfo; // every Part/PartInfo shape built today

export abstract class Directive {
	constructor(partInfo: PartInfo) {}
	abstract update(part: DirectivePart, ...args: readonly unknown[]): DirectiveReturn;
}

// Infers args from update()'s trailing parameters.
export function directive<C extends new (partInfo: PartInfo) => Directive>(Ctor: C): (...args: DirectiveArgs<C>) => DirectiveResult;
```

`PartType` full split (`ChildPart`/`AttributePart`/`BooleanAttributePart`/
`EventPart`/`PropertyPart`/`ElementPart`) so a directive can check `partInfo.type`/`part.type`.
`ATTRIBUTE` and `CHILD` are the two kinds actually dispatched to directives right now (by
`AttributePart`/`ChildPart` respectively) - the union has room to grow if more binding kinds gain
directive support later.

What `update()` may return depends on which kind of `Part` the directive is
bound to: a string/`null`/`undefined` for an attribute position (stringified/removed by
`AttributePart`), or anything a `ChildPart` already knows how to commit (string, nested `t`
result, array, `null`/`undefined`/`false`, or another directive's own wrapper, e.g.
`unsafeHtml()`'s) for a child position. `noChange` is the one value both recognize the same way:
"I already applied my update myself - do nothing further."

One output hook, `update()`:

- `constructor(partInfo)` - one-time setup, run only the first time a directive is used at a given
  position. Validate `partInfo.type`/`partInfo.name` here if the directive only supports certain
  bindings (e.g. "must be the `class` attribute").
- `update(part, ...args)` - called on every render with the live `part`. `args` are real trailing
  parameters - declare as many individually-typed ones as the directive takes (e.g.
  `update(part, classes: ClassInfo)`, or `update(part, a: number, b: string)`). Return one of:
  - `noChange` - you already updated the DOM yourself (e.g. via `classList`/`el.style`);
  - a raw value (a string, or `null`/`undefined` to remove the attribute; for a child position, a
    template, array, ...) for the part to commit;
  - `renderWith(MyRenderer, value)` - for a child position, hand the value to your own
    `ChildRenderer`.

`directive()` infers the callable function's parameters from `update()`'s trailing parameters:

```ts
import { Directive, directive, noChange, type DirectivePart } from './directive.js';

// Return a value for the part to commit:
class HelloDirective extends Directive {
	update(_part: DirectivePart, name: string): string {
		return `Hello, ${name}!`;
	}
}
export const hello = directive(HelloDirective);
// t`<div title=${hello('Ada')}></div>`

// Mutate the DOM yourself and return noChange. Real trailing parameters, not an array to
// destructure - works for any number of them:
class LogAttributeDirective extends Directive {
	update(part: DirectivePart, level: string, message: string): typeof noChange {
		console.log(`[${level}] ${part.name}:`, message);
		return noChange;
	}
}
export const logAttribute = directive(LogAttributeDirective);
// t`<div title=${logAttribute('info', 'hi')}></div>`
```

One `Directive` instance is created per *binding position* (the same spot as a persistent `Part`)
the first time a `directive()`-made function's result lands there, and is **reused across
re-renders at that position** as long as the same directive function keeps being used - so instance
fields are exactly where to keep "what did I do last time" state, with zero bookkeeping required
from `AttributePart`/`ChildPart` themselves. All of a directive's logic - including which binding
kind/name it's valid on - lives in its own module; `AttributePart`/`ChildPart` only dispatch. See
`./directives/class-map/` and `./directives/style-map/` for complete attribute-directive
examples - both override `update(part, classes)`/`update(part, styles)` for imperative
`classList`/`el.style` access and return `noChange`; their `update()` signatures are what
`directive()` infers `classMap`'s/`styleMap`'s argument types from:

```ts
import { t, render, classMap, styleMap } from './index.js';

const row = (active: boolean, big: boolean) => t`
	<li
		class="${classMap({ row: true, active })}"
		style="${styleMap({ color: active ? 'green' : null, fontSize: big ? '20px' : '14px' })}"
	>Item</li>
`;
```

- `classMap({ [className]: truthy })` - keys with a truthy value are added via `classList.add`;
  falsy or dropped keys are removed via `classList.remove` on the next update. Classes already on
  the element from static markup or elsewhere are left untouched. Throws if bound to any attribute
  other than `class`.
- `styleMap({ [property]: value })` - keys may be camelCase (`fontSize`) or kebab-case/custom
  properties (`font-size`, `--my-color`); `null`/`undefined` removes that property via
  `style.removeProperty`, anything else is stringified and set via `style.setProperty`. Throws if
  bound to any attribute other than `style`.
- Each must be the attribute's *only* interpolation, with no surrounding static text - same rule as
  `?`/`.`/`@`-prefixed bindings, since these bind a live object rather than a composed string.

`unsafeHtml()` (see [`./directives/unsafe-html/`](./directives/unsafe-html/)) is the one built-in **child**
directive: its constructor requires `partInfo.type === PartType.CHILD` (throws if bound to an
attribute instead), and its `update(part, markup)` returns `renderWith(UnsafeHtmlRenderer, markup)`, so parsing and
inserting the markup lives in that renderer and `ChildPart` just runs it. This is the pattern to
follow for a child directive that doesn't touch the DOM itself: return a value (or `renderWith(...)`)
and let `ChildPart` do the work, don't duplicate it.

## Embedding templates

Build reusable markup as functions (or variables) that return `t` results, then interpolate them
as child content in a parent template. The nested part keeps its own compiled template and updates
in place when you re-render with the same inner call site:

```ts
import { t, render } from './index.js';

const badge = (label: string) => t`<span class="badge">${label}</span>`;
const statusRow = (label: string) => t`<p>Status: ${badge(label)}</p>`;

const container = document.createElement('div');
render(statusRow('ok'), container);
render(statusRow('fail'), container); // same DOM; only the badge text changes
```

There is no separate “include” API—composition is just `${nestedHtmlResult}` between tags.

## Logic: conditionals and lists

Use ordinary JavaScript in `${...}` to pick or build child content. The parent `` t`...` ``
call site stays the same; only the bound values change between renders.

**If / else (different template parts):**

```ts
const success = (msg: string) => t`<p class="ok">${msg}</p>`;
const error = (msg: string) => t`<p class="err">${msg}</p>`;

const alert = (ok: boolean, msg: string) =>
	t`<section>${ok ? success(msg) : error(msg)}</section>`;

// or with an if statement before the parent template:
function alertBody(ok: boolean, msg: string) {
	if (ok) return success(msg);
	return error(msg);
}
const alertFromIf = (ok: boolean, msg: string) => t`<section>${alertBody(ok, msg)}</section>`;
```

Each branch returns a different `` t`...` `` (different call sites). The nested `ChildPart`
swaps them by tearing down the old subtree and mounting the new one. The outer `<section>` wrapper
is unchanged if `alert` / `alertFromIf` always uses the same parent literal.

**Lists (plain array vs `mapByKey`):**

```ts
const row = (label: string) => t`<li>${label}</li>`;

t`<ul>${items.map(item => row(item.label))}</ul>`; // positional (by index)

t`<ul>${mapByKey(items, (item) => item.id, (item) => row(item.label))}</ul>`; // keyed
```

Plain arrays are diffed by index. Use `mapByKey` when order or stable row identity matters — see
[`directives/map-by-key/README.md`](./directives/map-by-key/README.md).

## `render(result, container)`

Renders `result` into `container`. Call it again with a new `result` from the *same* tagged-template
call site (literally the same `t\`...\`` expression in source, evaluated with new values) and it
reuses the previous DOM, updating only the parts whose value changed:

```ts
function view(state: State) {
	return t`<div class=${state.open ? 'open' : ''}>${state.label}</div>`;
}

render(view(a), container); // builds DOM
render(view(b), container); // same call site -> patches class + text in place
```

Switching to a *different* template literal (e.g. a different `if` branch returning a different
`t\`...\`` string) tears down the old DOM and builds fresh - there's no cross-template diffing.

## Using it in a `UIElement`

`../../ui-element.ts`'s `UIElement.template()` hook accepts either style: sync the DOM imperatively
and return nothing (as existing components do), or return an `t` result and it's rendered into
the element automatically - same hook, same schedule, your choice per component. Read whatever
signal(s) you need directly inside `template()`:

```ts
import { tag, t, UIElement } from '../../../index.js';

@tag('hello-banner')
class HelloBanner extends UIElement {
	override template() {
		return t`<p>Hello, ${userName()}!</p>`;
	}
}
```

## How it works

For a **deeper, illustrated walkthrough** of how plain attributes are compiled (state machine,
placeholders, `literals` / `valueCount`, and the “rewind” trick for `class="prefix-${x}"`), see
[compile-attributes.md](./compiler/compile-attributes.md).

1. `t` just captures `strings`/`values` — no DOM work happens yet. Tagged template calls reuse
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

For how this interacts with **`UIElement`** (signal-driven `template()` re-runs, nested templates,
and when the fast path is lost), see [`../../../../doc/saved-ui-rerendering.md`](../../../../doc/saved-ui-rerendering.md).

## Limitations

- **Plain arrays are positional** (not keyed). For keyed lists use the built-in `mapByKey()` directive.
- **Small built-in directive set** (`classMap`, `styleMap`, `mapByKey`, `html`, …) - no `ref`,
  `guard`, `cache`, etc.,
  though the generic `AttributeDirective` protocol (see above) supports writing your own.
- **MathML needs the `math` tag for namespace-less fragments**, exactly like `svg` below: a complete
  `<math>...</math>` works with plain `t`, but a fragment such as `<mi>x</mi>` to be interpolated into an
  existing `<math>` must use `` math`<mi>x</mi>` ``.
- **SVG needs the `svg` tag for namespace-less fragments.** Markup containing its own top-level
  `<svg>...</svg>` works fine with plain `t` - the parser assigns the SVG namespace as soon as
  it sees the `<svg>` tag, even inside a `<template>`. But a reusable snippet meant to be
  interpolated as a *child* of an existing `<svg>` (e.g. `t`<circle r=${r} />`` with no
  wrapping `<svg>`) would parse as an unnamespaced, non-rendering element - use `svg` instead:

  ```ts
  import { t, svg, render } from './index.js';

  const dot = (r: number) => svg`<circle r=${r} />`;
  render(t`<svg viewBox="0 0 10 10">${dot(3)}</svg>`, container);
  ```
