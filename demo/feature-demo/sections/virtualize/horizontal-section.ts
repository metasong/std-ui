// Horizontal scroll.
import { tag, t, UIElement, virtualize, VirtualizeController } from '../../../../std-ui/src/index.js';

type Card = { i: number };

@tag('demo-virtualize-horizontal')
export class DemoVirtualizeHorizontal extends UIElement {
	readonly #items: Card[] = Array.from({ length: 2_000 }, (_, i) => ({ i }));
	readonly #list = new VirtualizeController();

	protected override template() {
		return t`
			<h2 id="horizontal">Horizontal list</h2>
			<p class="desc"><code>direction: 'horizontal'</code> — window follows <code>scrollLeft</code>. Fixed card width via <code>itemSize</code>.</p>
			<div class="demo-actions">
				<button type="button" class="tonal" @click=${() => this.#list.scrollToIndex(0)}>Start</button>
				<button type="button" class="tonal" @click="${() => this.#list.scrollToIndex(1000, { align: 'center' })}">#1000</button>
				<button type="button" class="tonal" @click="${() => this.#list.scrollToIndex(1999, { align: 'end' })}">End</button>
			</div>
			<div class="demo-v-scroller demo-v-scroller-x" style="overflow-x: auto; overflow-y: hidden; padding: 8px">
				<div class="demo-v-h-track">
					${virtualize(this.#items, {
						direction: 'horizontal',
						itemSize: 148,
						gap: 8,
						overscan: 3,
						controller: this.#list,
						keyFn: (c: Card) => c.i,
						renderItem: (c: Card) => t`
							<div class="demo-v-card" style="width: 140px">Card ${c.i}</div>
						`,
					})}
				</div>
			</div>
		`;
	}
}
