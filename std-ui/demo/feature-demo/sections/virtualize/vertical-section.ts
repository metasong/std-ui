// Fixed-height vertical list (~10k rows) + scrollToIndex.
import { tag, t, UIElement, virtualize, VirtualizeController, signalState } from '../../../../src/index.js';

type Row = { i: number };

@tag('demo-virtualize-vertical')
export class DemoVirtualizeVertical extends UIElement {
	readonly #items: Row[] = Array.from({ length: 10_000 }, (_, i) => ({ i }));
	readonly #list = new VirtualizeController();

	private readonly scrollHint = signalState('—');

	protected override template() {
		return t`
			<h2 id="vertical">Vertical list (fixed <code>itemSize</code>)</h2>
			<p class="desc">
				10,000 rows; only the viewport window exists in the DOM. Jump by index or scroll — render count stays small.
			</p>
			<p class="demo-v-meta">Rendered nodes: about viewport ÷ itemSize (+ overscan), not 10,000.</p>
			<div class="demo-actions">
				<button type="button" class="tonal" @click=${() => this.#list.scrollToIndex(0)}>Top</button>
				<button type="button" class="tonal" @click=${() => this.#list.scrollToIndex(4999)}>Middle</button>
				<button type="button" class="tonal" @click="${() => this.#list.scrollToIndex(9999, { align: 'end' })}">End</button>
				<button type="button" @click=${() => this.#jumpRandom()}>Random</button>
			</div>
			<p class="demo-v-meta">Last jump: ${this.scrollHint()}</p>
			<div class="demo-v-scroller demo-v-scroller-y">
				<div>
					${virtualize(this.#items, {
						itemSize: 36,
						gap: 0,
						overscan: 4,
						controller: this.#list,
						keyFn: (r: Row) => r.i,
						renderItem: (r: Row) => t`
							<div
								class="demo-v-row ${r.i % 2 === 0 ? 'demo-v-row-even' : ''}"
								style="height: 36px; box-sizing: border-box"
							>
								<span>Row ${r.i}</span>
							</div>
						`,
					})}
				</div>
			</div>
		`;
	}

	#jumpRandom(): void {
		const i = Math.floor(Math.random() * this.#items.length);
		this.#list.scrollToIndex(i, { align: 'center' });
		this.scrollHint.set(`#${i}`);
	}
}
