// Light-DOM slots: `slot()` directive + `@querySlotted` reading the same content.
import { t, tag, UIElement, querySlotted } from '@std-ui/core';
import { slot, stateTree } from '@std-ui/ext';

@tag('demo-light-card')
export class DemoLightCard extends UIElement {
	readonly slotted = stateTree('');

	@querySlotted<HTMLElement>({ selector: '*' }) defaultChildren!: HTMLElement[];
	@querySlotted<HTMLElement>({ slot: 'title', selector: '*' }) titleChildren!: HTMLElement[];

	protected override template() {
		return t`
			<article class="demo-slot-card">
				<header>${slot('title', t`<em>(no title)</em>`)}</header>
				<div class="body">${slot()}</div>
				<footer>${slot('footer', t`<small>default footer (fallback)</small>`)}</footer>
				<button type="button" @click=${() => this.slotted.set(
					`title: ${this.titleChildren.length}, default elements: ${this.defaultChildren.length}`,
				)}>count slotted</button>
				<small>${this.slotted.get()}</small>
			</article>
		`;
	}
}

@tag('demo-slot-light-section')
export class DemoSlotLightSection extends UIElement {
	protected override template() {
		return t`
			<section class="demo-slot-block" id="light">
				<h2>Light DOM <code>slot()</code></h2>
				<p class="desc">
					Default <code>UIElement</code> (no shadow root). The parent's children are snapshotted on
					connect and moved into the <code>slot()</code> positions. Global page styles still apply.
				</p>
				<demo-light-card>
					<h3 slot="title">Card with title</h3>
					<p>Default-slot paragraph.</p>
					<p>Second paragraph.</p>
					<small slot="footer">Custom footer</small>
				</demo-light-card>
				<demo-light-card>
					<p>No title, no footer: fallbacks render.</p>
				</demo-light-card>
			</section>
		`;
	}
}
