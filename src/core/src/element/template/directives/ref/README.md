# `ref`

Gives access to a rendered element, like a `ref`.
Bind it on the element itself (no attribute name):

```ts
import { t, ref, createRef } from '@std-ui/core';

const input = createRef<HTMLInputElement>();
t`<input ${ref(input)}>`;               // input() === the <input> after render
t`<input ${ref(el => el?.focus())}>`;   // callback form
```

- `createRef<T>()` returns a signal of the element: `undefined` before render and after teardown. Call it to read (tracked in effects and templates) or `.peek()` for an untracked read.
- A callback receives the element on render, and `undefined` on teardown or when the binding switches to another ref.
- Re-rendering with the same ref does nothing; passing a different ref clears the old one and sets the new one.
- Several element bindings and normal attributes can share a tag: `<div class=${c} ${ref(a)} ${ref(b)}>`.
- Falsy values are ignored (`${cond && ref(r)}`); any other non-directive in an element slot throws.
- The callback is called with `this` = the `host` given to `render(result, container, { host })`
  (`UIElement` passes itself; default: none). `@event` handlers get the same `this` (default: the element).

Implementation: element slots are the Builder's `onTagSlot` hook (see [`../../factory/design.md`](../../factory/design.md)),
backed by `ElementPart` in `parts/element-part.ts`.
