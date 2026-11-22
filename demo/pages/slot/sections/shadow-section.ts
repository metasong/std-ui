// Shadow-DOM slots: native `<slot>` + `@queryAssignedNodes` (delegates to `slot.assignedNodes()`).
import { t, tag, UIElement, queryAssignedNodes } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';

@tag('demo-shadow-card')
export class DemoShadowCard extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	readonly slotted = stateTree('');

	@queryAssignedNodes<HTMLElement>({ selector: '*' }) defaultChildren!: HTMLElement[];
	@queryAssignedNodes<HTMLElement>({ slot: 'title', selector: '*' }) titleChildren!: HTMLElement[];

	protected override template() {
		return t`
			<style>
				:host { display: block; margin-block: 1rem; }
				article { border: 2px solid var(--std-sys-color-tertiary, #7d5260); border-radius: 12px; padding: 1rem; }
				::slotted([slot='title']) { color: var(--std-sys-color-tertiary, #7d5260); margin: 0 0 0.5rem; }
				button { font: inherit; }
			</style>
			<article>
				<header><slot name="title"><em>(no title)</em></slot></header>
				<div><slot></slot></div>
				<footer><slot name="footer"><small>default footer (fallback)</small></slot></footer>
				<button type="button" @click=${() => this.slotted.set(
					`title: ${this.titleChildren.length}, default elements: ${this.defaultChildren.length}`,
				)}>count slotted</button>
				<small>${this.slotted()}</small>
			</article>
		`;
	}
}

@tag('demo-slot-shadow-section')
export class DemoSlotShadowSection extends UIElement {
	protected override template() {
		return t`
			<section class="demo-slot-block" id="shadow">
				<h2>Shadow DOM native <code>&lt;slot&gt;</code></h2>
				<p class="desc">
					Same markup, but the component sets <code>static shadowRootOptions</code> and uses native
					<code>&lt;slot&gt;</code> (so <code>::slotted()</code> styling works). Do not use the
					<code>slot()</code> directive here; dev builds throw.
				</p>
				<demo-shadow-card>
					<h3 slot="title">Card with title</h3>
					<p>Default-slot paragraph.</p>
					<p>Second paragraph.</p>
					<small slot="footer">Custom footer</small>
				</demo-shadow-card>
				<demo-shadow-card>
					<p>No title, no footer: fallbacks render.</p>
				</demo-shadow-card>
			</section>
		`;
	}
}
