# `styleMap` — `style` attribute directive

Built-in **attribute directive**: sets inline style properties via `el.style` instead of
stringifying the whole `style` attribute on every render. The `styleMap`, trimmed to
this engine's needs.

```ts
import { t, styleMap } from 'std-ui';

t`<div style="${styleMap({ color: 'red', fontSize: active ? '16px' : null })}"></div>`;
```

Design notes: [`design.md`](./design.md).

## API

### `styleMap(styles)`

- Keys may be camelCase (`fontSize`) or kebab-case / custom properties (`font-size`, `--my-color`).
- `null` / `undefined` skips a property for this render; if it was set before, it is removed on
  the next diff.
- Other values are stringified and applied with `CSSStyleDeclaration.setProperty`.
- May be the only interpolation on `style`, or mixed with static CSS in the same attribute (see
  [`design.md`](./design.md)).
- Must be bound to the `style` attribute — the directive throws otherwise.

## Why not just a string?

`style="color: ${c}"` recomposes the whole attribute and overwrites unrelated declarations.
`styleMap` keeps per-binding state and only touches properties it manages.

## Related reading

- [`design.md`](./design.md) — implementation (`StyleMapDirective`, `toCssPropertyName()`).
- [`../../directive.ts`](../../directive.ts) — `Directive` / `directive()` protocol.
- [`../../html.md`](../../html.md#directives) — binding kinds and custom directives.
- [`../class-map/README.md`](../class-map/README.md) — sibling `classMap` directive.
- [`../README.md`](../README.md) — index of built-in directives.
