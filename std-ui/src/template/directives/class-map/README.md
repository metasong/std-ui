# `classMap` — `class` attribute directive

Built-in **attribute directive**: applies class toggles via `classList` instead of stringifying a
whole `class` attribute on every render. Mirrors lit-html's `classMap`, trimmed to this engine's
needs.

```ts
import { t, classMap } from 'std-ui';

t`<div class="${classMap({ active: isActive, hidden: !visible })}"></div>`;
```

Design notes: [`design.md`](./design.md).

## API

### `classMap(classes)`

- Keys with a **truthy** value are added; **falsy** keys are removed (or left alone if never present).
- Classes already on the element from static markup, imperative `classList` changes, or a static
  prefix in the same attribute are not clobbered — only keys this directive manages are diffed.
- May be the only interpolation on `class`, or mixed with static tokens
  (`class="btn ${classMap({ ... })}"`); static tokens are unioned into the same diff (see
  [`design.md`](./design.md)).
- Must be bound to the `class` attribute — the directive throws otherwise.

## Why not just a string?

`class=${isActive ? 'active' : ''}` recomposes the whole attribute each render and overwrites
anything else on `class`. `classMap` keeps per-binding state ("what I set last time") and only
calls `classList.add` / `remove` for keys that changed.

## Related reading

- [`design.md`](./design.md) — implementation (`ClassMapDirective`, `update()` vs `render()`).
- [`../../directive.ts`](../../directive.ts) — `Directive` / `directive()` protocol.
- [`../../html.md`](../../html.md#directives) — binding kinds and custom directives.
- [`../style-map/README.md`](../style-map/README.md) — sibling `styleMap` directive.
- [`../README.md`](../README.md) — index of built-in directives.
