# `ref`

Gives access to a rendered element, like a `ref`.
Bind it on the element itself (no attribute name):

```ts
import { t, ref, createRef } from '@std-ui/core';

const input = createRef<HTMLInputElement>();
t`<input ${ref(input)}>`;               // input.get() === the <input> after render
t`<input ${ref(el => el?.focus())}>`;   // callback form
```

- `createRef<T>()` returns a signal of the element: `undefined` before render and after teardown. Call it to read (tracked in effects and templates) or `.peek()` for an untracked read.
- A callback receives the element on render, and `undefined` on teardown or when the binding switches to another ref.
- Re-rendering with the same ref does nothing; passing a different `Ref` clears the old one and sets the new one.
- A callback replaced by another callback is **not** a switch: an inline `ref(el => ...)` is a new function on every render, and it still runs only once (on first render), then with `undefined` on teardown (the latest callback is the one called). Switching between a `Ref` and a callback does clear the old and set the new.
- Several element bindings and normal attributes can share a tag: `<div class=${c} ${ref(a)} ${ref(b)}>`.
- Falsy values are ignored (`${cond && ref(r)}`); any other non-directive in an element slot throws.
- The callback is called with `this` = the `host` given to `render(result, container, { host })`
  (`UIElement` passes itself; default: none). `@event` handlers get the same `this` (default: the element).

Implementation: element slots are the Builder's `onTagSlot` hook (see [`../../factory/design.md`](../../factory/design.md)),
backed by `ElementPart` in `parts/element-part.ts`.
