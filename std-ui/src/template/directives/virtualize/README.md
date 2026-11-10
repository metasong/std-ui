# `virtualize` — windowed lists and grids

Renders only the rows near the viewport of a large list; two spacer elements stand in for the rest.
Supports grids (`lanes`), fixed or measured item sizes, vertical or horizontal scrolling, and
`scrollToIndex()`. Internals: [`design.md`](./design.md).

```ts
import { t, virtualize, VirtualizeController } from 'std-ui';

const list = new VirtualizeController();

t`
	<div class="scroller" style="height: 400px; overflow-y: auto">
		<div class="grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">
			${virtualize(photos, {
				itemSize: 120,
				gap: 8,
				lanes: 4,
				keyFn: (p) => p.id,
				controller: list,
				renderItem: (p) => t`<img src=${p.url} style="height: 120px" />`,
			})}
		</div>
	</div>
`;

list.scrollToIndex(5000, { align: 'center' });
```

## Direction and terms

`direction` is `'vertical'` (default) or `'horizontal'`. Everything else is expressed relative to it:

- **size** — an item's extent *along* the scroll direction (height when vertical, width when horizontal).
- **lane** — a slot *across* it. `lanes: 4` vertical = 4 grid columns; horizontal = 4 grid rows.
- **row** — one step along the scroll direction: a group of up to `lanes` items.

## Options

| Option | Default | Notes |
|---|---|---|
| `renderItem(item, index)` | required | Called only for windowed items. Must return content containing an element. |
| `direction` | `'vertical'` | `'horizontal'` scrolls along x. |
| `itemSize` | — | **Fixed mode.** Px size of one row; items must really be this size. Exact, no measuring. |
| `estimatedItemSize` | mean of measured rows (40 before any) | Optional hint for **variable mode** (when `itemSize` is unset): assumed size of unmeasured rows. |
| `lanes` | `1` | Items per row across the scroll direction. Number, or `(crossSize) => number` (container width when vertical, height when horizontal), re-evaluated on resize. |
| `gap` | `0` | Px between rows. Must equal the container's CSS `gap`. |
| `keyFn(item, index)` | index | Keys keep row DOM stable as the window slides or data shifts. |
| `overscan` | `3` | Extra rows beyond each viewport edge. |
| `scroller` | nearest scrollable ancestor, else page | Element or `window`. |
| `initialCount` | `20` | Items rendered before a viewport can be measured. |
| `controller` | — | `VirtualizeController` for `scrollToIndex`. |
| `spacerTag` | `div` | Use `li` inside `ul`/`ol`. |

Neither size option is required: with both unset, sizes are measured and unmeasured rows assume the
mean of those measured so far.

## `scrollToIndex(index, { align, behavior })`

`align`: `'start'` (default), `'center'`, `'end'`, `'nearest'`. `behavior: 'smooth'` animates and the
window follows scroll events; otherwise the jump and re-render are synchronous. Calls made before
the first render are applied once the list is attached. With `lanes > 1` the target is the item's row.

## Layout contract

- Vertical: container is `display: grid` (or flex column); for `lanes > 1`, `grid-template-columns`
  must produce that many columns. Spacers span all columns.
- Horizontal: scroll container has `overflow-x: auto`; container is `display: flex` (one lane) or
  `display: grid; grid-auto-flow: column; grid-template-rows: repeat(lanes, …)`. Spacers span all rows.
- The CSS `gap` equals the `gap` option.
- Fixed mode: every item is exactly `itemSize`. Variable mode: any size (a row is as large as its
  largest item).
- Items must render at least one element (rows are located and measured through their elements).
- Keys must be unique within the rendered window.
- Right-to-left horizontal lists are not supported yet.

## Variable sizes

Omit `itemSize`. Rows are measured after render, and re-measured when they resize (images loading,
text reflow) via `ResizeObserver`. The scroll bar length starts as an estimate and refines as rows
are measured. When rows before the viewport change size, the scroll position is adjusted so the
content in view doesn't jump. A good `estimatedItemSize` means less scroll-bar drift. `scrollToIndex`
re-aims until the target row is stable; with `behavior: 'smooth'` it aims at the current estimate,
so the landing can be off for far, unmeasured targets.

```ts
t`<div style="overflow-x: auto; width: 600px">
	<div style="display: flex; gap: 8px">
		${virtualize(cards, {
			direction: 'horizontal',
			itemSize: 160,
			gap: 8,
			renderItem: (c) => t`<div style="width: 160px">${c.title}</div>`,
		})}
	</div>
</div>`;
```
