# `styleMap` — internal design

Implementation of the built-in `style` attribute directive. Usage: [`README.md`](./README.md).

## Layout

| File | Owns |
|---|---|
| [`main.ts`](./main.ts) | `toCssPropertyName()`, `StyleMapDirective` + `export const styleMap = directive(StyleMapDirective)`. |
| [`index.ts`](./index.ts) | Re-export. |
| [`style-map.test.ts`](./style-map.test.ts) | Behavior tests through `AttributePart` directly. |
| [`../index.ts`](../index.ts) | Public re-export with other directives. |
| [`../directives.test.ts`](../directives.test.ts) | End-to-end tests through `t()` / `render()`. |

Dispatch is generic — see [`../directive.ts`](../directive.ts).

## Why it mutates the DOM and returns `noChange`

Returning a value would give one string for `setAttribute`, replacing the entire `style` attribute. This
directive diffs only properties **it** set. It overrides `update()`, mutates `element.style`, and
returns `noChange`.

Same overall pattern as [`../class-map/design.md`](../class-map/design.md).

## Lifecycle

1. **Constructor** — `partInfo.type === PartType.ATTRIBUTE` and `name === 'style'`, else throw.
2. **`#previous`** — `Set<string>` of CSS property names this instance last set (canonical names
   after `toCssPropertyName()`).
3. **`update()`** — build `next` from non-nullish entries; handle static portion of the attribute if
   present; remove dropped properties via `removeProperty`; `setProperty` for new/changed values;
   store `next` in `#previous`; return `noChange`.

## `toCssPropertyName()`

- Custom properties (`--*`) pass through unchanged.
- camelCase → kebab-case (`fontSize` → `font-size`) for `setProperty`.

## Element typing

`part.element` is treated as `HTMLElement | SVGElement` so `.style` is available (only meaningful
on elements that support inline `style`).

## Related reading

- [`README.md`](./README.md) — public API.
- [`../class-map/`](../class-map/) — `classMap` (same protocol, `classList`).
- [`../directive.ts`](../directive.ts) — `Directive`, `PartType`, `noChange`, `staticText`.
- [`../map-by-key/design.md`](../map-by-key/design.md) — child directive using `renderWith()`.
- [`../html/`](../html/) — `html()` child directive.
