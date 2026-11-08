# `virtualize` — windowed lists and grids

Renders only the rows near the viewport of a large list; two spacer elements stand in for the rest.
Supports multi-column grids and `scrollToIndex()`. Internals: [`design.md`](./design.md).

```ts
import { html, virtualize, VirtualizeController } from 'std-ui';

const list = new VirtualizeController();

html`
	<div class="scroller" style="height: 400px; overflow-y: auto">
		<div class="grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">
			${virtualize(photos, {
				itemHeight: 120,
				gap: 8,
				columns: 4,
				keyFn: (p) => p.id,
				controller: list,
				renderItem: (p) => html`<img src="${p.url}" style="height: 120px" />`,
			})}
		</div>
	</div>
`;

list.scrollToIndex(5000, { align: 'center' });
```

## Options

| Option | Default | Notes |
|---|---|---|
| `renderItem(item, index)` | required | Called only for windowed items. Must return content containing an element. |
| `itemHeight` | required | Px height of one row of items. Items must really be this tall. |
| `keyFn(item, index)` | index | Keys keep row DOM stable as the window slides or data shifts. |
| `columns` | `1` | Number, or `(containerWidth) => number` (re-evaluated on resize). |
| `gap` | `0` | Row gap px. Must equal the container's CSS `gap` / `row-gap`. |
| `overscan` | `3` | Extra rows beyond each viewport edge. |
| `scroller` | nearest scrollable ancestor, else page | Element or `window`. |
| `initialCount` | `20` | Items rendered before a viewport can be measured. |
| `controller` | — | `VirtualizeController` for `scrollToIndex`. |
| `spacerTag` | `div` | Use `li` inside `ul`/`ol`. |

## `scrollToIndex(index, { align, behavior })`

`align`: `'start'` (default), `'center'`, `'end'`, `'nearest'`. `behavior: 'smooth'` animates and the
window follows scroll events; otherwise the jump and re-render are synchronous. Calls made before
the first render are applied once the list is attached. In a grid the target is the item's row.

## Layout contract

- Container is `display: grid` (or flex column) with the same `gap` passed as `gap`; for a grid,
  `grid-template-columns` must produce `columns` columns. Spacers span all columns.
- Every item is exactly `itemHeight` tall (fixed-size only; variable heights are not supported).
- Keys must be unique within the rendered window.
