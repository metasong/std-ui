# `mapByKey` — internal design

Keyed list rendering for child positions (under an explicit name). For
usage and API, see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`main.ts`](./main.ts) | `MapByKeyDirective`, `export const mapByKey`, duplicate-key validation, building `{ key, value }[]`. |
| [`map-by-key-renderer.ts`](./map-by-key-renderer.ts) | `MapByKeyRenderer`, keyed DOM create / move / remove. |
| [`index.ts`](./index.ts) | Public re-export of `mapByKey`. |
| [`map-by-key.test.ts`](./map-by-key.test.ts) | Behavior through `ChildPart` (and renderer edge cases). |
| [`../directives.test.ts`](../directives.test.ts) | End-to-end through `t()` / `render()`. |

`mapByKey` does not live in `../parts/`: `ChildPart` only knows the generic `renderWith()` protocol
from [`../../parts/child-renderers/child-renderer.ts`](../../parts/child-renderers/child-renderer.ts). The directive
supplies its own renderer class, same pattern as [`../unsafe-html/`](../unsafe-html/).

## Why it returns a renderer instead of touching the DOM

Unlike `classMap` / `styleMap`, `mapByKey`'s `update()` returns
`renderWith(MapByKeyRenderer, entries)`. The directive does not mutate the DOM itself; it prepares
keyed entries and delegates reconciliation to `MapByKeyRenderer` on each application.

## Data flow

```mermaid
flowchart LR
  A["mapByKey(items, keyFn, template)"] --> B["MapByKeyDirective.update()"]
  B --> C["entries: { key, value }[]"]
  C --> D["renderWith(MapByKeyRenderer, entries)"]
  D --> E["ChildPart picks MapByKeyRenderer"]
  E --> F["MapByKeyRenderer.update(entries)"]
```

1. **`MapByKeyDirective.update()`** walks `items`, assigns keys (`keyFn` or index), checks uniqueness,
   and maps each item through `template()` into `value`.
2. **`ChildPart`** sees `isRenderWith`, reuses or instantiates `MapByKeyRenderer` anchored on the
   part's end comment.
3. **`MapByKeyRenderer.update()`** reconciles against a `Map<key, KeyedItem>`.

## `MapByKeyRenderer` DOM model

Each logical row owns a **range** `[startComment … endComment]`:

- `start` — opening `std-ui-part` comment.
- `part` — `ChildPart` bound to `end` (the closing comment), same as other child content.

New rows insert `start` and `end` before the list anchor, then wrap the row's rendered value in that
`ChildPart`.

Reconciliation passes:

1. **Remove** keys absent from the new `entries` (`removeKeyed`: `ChildPart.dispose()` + remove
   `start`).
2. **Walk `entries` backwards**, with `ref` starting at the list anchor:
   - Missing key → create comment pair + `ChildPart`.
   - Existing key out of order → `insertBefore` the whole node range before `ref`.
   - `item.part.update([value])` either way.
   - Set `ref = item.start` for the next iteration (working back toward document start).

Backward iteration means each row is placed immediately before the row that follows it in the final
order, using a single forward reference `ref`.

## Lifecycle

| Hook | Behavior |
|---|---|
| `MapByKeyRenderer.disconnect()` | `disconnect()` on each nested `ChildPart` (directives in rows), DOM kept. |
| `MapByKeyRenderer.dispose()` | Full teardown when renderer is replaced or part cleared. |
| `ChildPart` swap | If a non-`renderWith` value arrives, `ChildPart` disposes the renderer. |

## Comparison with `ListRenderer`

| | `ListRenderer` (plain array) | `MapByKeyRenderer` |
|---|---|---|
| Identity | Index `i` | User key |
| Reorder | Patch value at index `i` | Move DOM ranges |
| Shrink | `pop()` extra `ChildPart`s | Remove by key |
| Grow | New anchor before list end | New comment pair per new key |

## Related reading

- [`README.md`](./README.md) — public API.
- [`../../parts/child-part.ts`](../../parts/child-part.ts) — renderer selection and directive application.
- [`../unsafe-html/`](../unsafe-html/) — another `renderWith()` child directive.
- [`../../parts/child-renderers/list-renderer.ts`](../../parts/child-renderers/list-renderer.ts) — positional list diff.
