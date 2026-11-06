# `classMap` / `styleMap` — attribute directives

Two built-in **attribute directives**: bindings that take over applying themselves to the element
instead of being stringified by `AttributePart`. Both mirror their lit-html namesakes, trimmed to
this engine's needs. Each must be the attribute's *only* interpolation, with no surrounding static
text — same rule as `?`/`.`/`@`-prefixed bindings, since they bind a live object, not a composed
string.

```ts
import { html, classMap, styleMap } from 'std-ui';

html`
	<div
		class="${classMap({ active: isActive, hidden: !visible })}"
		style="${styleMap({ color: 'red', fontSize: active ? '16px' : null })}"
	></div>
`;
```

## `classMap(classes)`

Toggles individual classes on/off via `classList`, rather than recomputing the whole `class`
attribute as a string.

- Keys with a **truthy** value are added; keys with a **falsy** value are removed (or left alone
  if never present).
- Classes already on the element from static markup or elsewhere (e.g. `class="btn ${classMap(...)}"`
  is **not** supported — see below) are never touched.
- Must be bound to the `class` attribute — the directive throws otherwise.

```ts
html`<div class="${classMap({ active: isActive, hidden: !visible })}"></div>`;
```

## `styleMap(styles)`

Sets/removes individual inline style properties via `el.style`, rather than recomputing the whole
`style` attribute as a string.

- Keys may be camelCase (`fontSize`) or kebab-case/custom properties (`font-size`, `--my-color`).
- A value of `null`/`undefined` removes that property; anything else is stringified.
- Must be bound to the `style` attribute — the directive throws otherwise.

```ts
html`<div style="${styleMap({ color: 'red', fontSize: active ? '16px' : null })}"></div>`;
```

## Why not just a string?

A plain template string (`class="${isActive ? 'active' : ''}"`) works for simple cases, but
recomputing the whole attribute as a string on every render has two costs these directives avoid:

- It can't coexist with classes/styles set by other code (e.g. a class added imperatively via
  `el.classList.add(...)` outside the template would get clobbered on the next render).
- Diffing is manual — you'd need to track "what was set last time" yourself to only touch what
  actually changed.

`classMap`/`styleMap` keep that "what did I set last time" state internally (one directive
instance per binding position, reused across re-renders) and only call `classList`/`style`
methods for the keys that actually changed.

## Writing your own directive

`classMap`/`styleMap` are just two consumers of a generic protocol — `Directive`/`directive()` in
[`../template/directive.ts`](../template/directive.ts), which also backs the one built-in
**child** directive, `unsafeHTML()` (see [`../template/unsafe-html.ts`](../template/unsafe-html.ts)).
For the general protocol (lifecycle hooks, `Part`/`PartInfo`, `noChange`, instance reuse, both the
attribute and child binding kinds) and how to write a custom directive, see the "Directives"
section of [`../template/html.md`](../template/html.md#directives). [`design.md`](./design.md)
covers how `classMap`/`styleMap` specifically use it.

## Related reading

- [`design.md`](./design.md) — how `classMap`/`styleMap` are implemented internally.
- [`../template/directive.ts`](../template/directive.ts) — the generic `Directive`/`directive()` protocol these are built on.
- [`../template/html.md`](../template/html.md) — binding table and the "Directives" section (how to write a custom one).
