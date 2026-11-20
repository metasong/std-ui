# `cache`

Keeps the DOM of templates that are switched out,
Bind it in a child position:

```ts
import { t, cache } from '@std-ui/core';

t`${cache(loggedIn ? t`<x-home></x-home>` : t`<x-login></x-login>`)}`;
```

- Without `cache`, switching templates discards the old DOM and rebuilds it on the way back. With it, the old nodes and
  their live parts are stashed in a `DocumentFragment` and re-inserted, so input values, scroll positions and element
  state survive.
- Entries are keyed by the template's `strings`, so each distinct `t` literal gets one cached instance. Cached entries
  live until the binding is torn down; there is no eviction.
- Re-rendering the active template updates its values in place, as usual.
- Non-template values (strings, numbers) render as text; `null`/`undefined`/`false` render nothing. The active template is
  stashed when that happens.
- Only valid in child positions; attribute, property or element bindings throw.
- A stashed template's parts are not disconnected until the whole binding is torn down.

Implementation: `CacheRenderer` in `index.ts`, handed to `ChildPart` via `renderWith()`.
