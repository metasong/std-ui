// Variable row heights + sticky section headers (`isHeader`).
import { tag, t, UIElement, virtualize, VirtualizeController } from '../../../../src/index.js';

type Entry = { i: number; section: number };

const SECTIONS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

function isHeader(e: Entry): boolean {
	return e.i % 25 === 0;
}

function rowSize(e: Entry): number {
	if (isHeader(e)) return 40;
	return 28 + (e.i % 5) * 6;
}

@tag('demo-virtualize-headers')
export class DemoVirtualizeHeaders extends UIElement {
	readonly #items: Entry[] = Array.from({ length: 800 }, (_, i) => ({
		i,
		section: Math.floor(i / 100),
	}));
	readonly #list = new VirtualizeController();

	protected override template() {
		return t`
			<h2 id="headers">Sticky headers (variable size)</h2>
			<p class="desc">
				<code>isHeader</code> pins the current section title. Row sizes differ; no <code>itemSize</code> — sizes are measured. Give headers an opaque background (here
				<code>demo-v-header</code>).
			</p>
			<div class="demo-actions">
				<button type="button" class="tonal" @click="${() => this.#list.scrollToIndex(350, { align: 'start' })}">Section “Delta”</button>
				<button type="button" class="tonal" @click=${() => this.#list.scrollToIndex(725)}>Section “Theta”</button>
			</div>
			<div class="demo-v-scroller demo-v-scroller-y">
				<div>
					${virtualize(this.#items, {
						gap: 0,
						lanes: 1,
						isHeader,
						overscan: 3,
						controller: this.#list,
						keyFn: (e: Entry) => e.i,
						renderItem: (e: Entry) => {
							const h = rowSize(e);
							if (isHeader(e)) {
								const title = SECTIONS[e.section] ?? `Section ${e.section}`;
								return t`
									<div class="demo-v-header" style="height: ${String(h)}px; box-sizing: border-box">${title} · row ${e.i}</div>
								`;
							}
							return t`
								<div class="demo-v-row" style="height: ${String(h)}px; box-sizing: border-box">
									<span>Item ${e.i}</span>
								</div>
							`;
						},
					})}
				</div>
			</div>
		`;
	}
}
