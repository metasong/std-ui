// Multi-lane grid (4 columns).
import { tag, t, UIElement, virtualize } from '../../../../src/index.js';

type Cell = { i: number };

@tag('demo-virtualize-grid')
export class DemoVirtualizeGrid extends UIElement {
	readonly #items: Cell[] = Array.from({ length: 4_000 }, (_, i) => ({ i }));

	protected override template() {
		return t`
			<h2 id="grid">Grid (<code>lanes: 4</code>)</h2>
			<p class="desc">4,000 cells in a 4-column grid. Each virtualized row is one grid row (4 items).</p>
			<div class="demo-v-scroller demo-v-scroller-y">
				<div class="demo-v-grid">
					${virtualize(this.#items, {
						itemSize: 72,
						gap: 8,
						lanes: 4,
						overscan: 2,
						keyFn: (c: Cell) => c.i,
						renderItem: (c: Cell) => t`
							<div class="demo-v-tile" style="height: 72px">${c.i}</div>
						`,
					})}
				</div>
			</div>
		`;
	}
}
