# `virtualize` — internal design

Windowed rendering for large lists/grids as a `commitWith()` child directive, like
[`mapByKey`](../map-by-key/design.md). Usage: [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`core.ts`](./core.ts) | `VirtualizeDirective`, arg validation, `commitWith(VirtualizeCommitter, { items, options })`. |
| [`virtualize-committer.ts`](./virtualize-committer.ts) | DOM, scroller wiring, measuring, windowing, `scrollToIndex`. |
| [`layout.ts`](./layout.ts) | Pure fixed-grid math (window, spacer heights, scroll targets). |
| [`controller.ts`](./controller.ts) | `VirtualizeController` handle (+ pre-attach pending call). |
| [`../keyed-rows.ts`](../keyed-rows.ts) | `KeyedRows`: keyed range reconciliation, shared with `mapByKey`. |

## Why a committer owns the window

`render()` runs when the *parent* re-renders; scrolling doesn't re-render the parent. So the
committer listens to the scroller itself, and holds `items` + `options` from the last `update()` so
it can recompute the window and call `renderItem` for newly visible items without a parent render.
`render()` is O(1): it never walks `items`.

## DOM model

```
<container>
  …
  <spacer top>      display:none when 0 rows hidden
  [row ranges]      KeyedRows, inserted before the bottom spacer
  <spacer bottom>
  <!-- anchor -->
```

Spacers are `grid-column: 1 / -1; visibility: hidden; aria-hidden`. A spacer is a grid/flex item, so
one `gap` separates it from its neighbour: height for `n` hidden rows is `n * (itemHeight + gap) - gap`.

## Window math (`layout.ts`)

Row-based: `rows = ceil(count / columns)`, `stride = itemHeight + gap`. For list-relative scroll
`offset` and `viewport`: first row `floor(offset / stride)`, last (exclusive) `ceil((offset + viewport) / stride)`,
each widened by `overscan` and clamped. Items are `[startRow*columns, min(count, endRow*columns))`, so
grid rows are always whole except the final one. `columns` may be a function of container width.

## Measuring

- Scroller: `options.scroller`, else nearest ancestor with `overflow-y: auto|scroll|overlay` (crossing
  shadow roots), else `window`.
- `scrollTop` / viewport: element `scrollTop`/`clientHeight`, or `scrollY`/`innerHeight`.
- **List top** (list edge in scroller content coordinates) is derived from the first rendered row:
  `rect.top - scrollerRect.top + scrollTop - rowOffset(startRow)`. This tolerates content above the
  list and works when the top spacer is hidden. It is cached; after each render it is re-measured
  and, if it moved, the window is recomputed once more (first render, layout shifts).
- Before attach / without a viewport (detached, `clientHeight` 0) the first `initialCount` items render.

## Update paths

| Trigger | `renderItem` runs for | Notes |
|---|---|---|
| Parent re-render → `update()` | every windowed item (`full`) | data may have changed |
| `scroll` (rAF-throttled) | only newly entered keys | existing rows keep DOM/state |
| `ResizeObserver` (scroller, parent) | only new keys | `columns` may change |

Unchanged window signature (`start:end:columns:count:height:gap`) skips the reconcile.

## `scrollToIndex`

`target = scrollTarget(...) + listTop` where `align` is `start | center | end | nearest`, computed on
the item's row. Instant: set `scrollTop` (or `window.scrollTo({behavior:'instant'})`) then refresh
synchronously, so the target row exists on return. Smooth: `scrollTo({behavior:'smooth'})` and the
window follows scroll events. Because heights are fixed the target is exact (no correction loop).
Calls before the scroller is attached are queued (in the committer and in the controller).

## Lifecycle

| Hook | Behavior |
|---|---|
| `disconnect()` | Remove scroll/resize listeners, cancel rAF, `disconnect()` row parts; DOM kept. Re-attached on next `update()`. |
| `dispose()` | Also dispose rows, remove spacers, detach controller; later refreshes are no-ops. |

## Non-goals / future

- Variable item heights: would need an estimate + `ResizeObserver` measurement + prefix-sum offsets
  (replace `layout.ts` row math) and a correction loop in `scrollToIndex`.
- Horizontal virtualization, sticky headers, and window-height changes from `renderItem` output.
