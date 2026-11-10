# `ref`

Gives access to a rendered element, like lit's [`ref`](https://lit.dev/docs/templates/directives/#referencing-rendered-dom).
Bind it on the element itself (no attribute name):

```ts
import { t, ref, createRef } from 'std-ui';

const input = createRef<HTMLInputElement>();
t`<input ${ref(input)}>`;               // input.value === the <input> after render
t`<input ${ref(el => el?.focus())}>`;   // callback form
```

- `createRef<T>()` returns `{ value?: T }`. `value` is `undefined` before render and after teardown.
- A callback receives the element on render, and `undefined` on teardown or when the binding switches to another ref.
- Re-rendering with the same ref does nothing; passing a different ref clears the old one and sets the new one.
- Several element bindings and normal attributes can share a tag: `<div class=${c} ${ref(a)} ${ref(b)}>`.
- Falsy values are ignored (`${cond && ref(r)}`); any other non-directive in an element slot throws.
- Like lit, the callback is called with `this` = the `host` given to `render(result, container, { host })`
  (`UIElement` passes itself; default: none). `@event` handlers get the same `this` (default: the element).

Implementation: element slots are the engine's `onTagSlot` hook (see [`../../compiler/design.md`](../../compiler/design.md)),
backed by `ElementPart` in `parts/core.ts`.
