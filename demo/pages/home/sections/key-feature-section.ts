// "A taste" (from the README): signals, an HTML attribute mirrored to state, and context passed down the tree.
import { attribute, css, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { consume, createContextKey, provide } from '@std-ui/ext';

interface Theme { mode: 'light' | 'dark'; }
const ThemeKey = createContextKey<Theme>('home-theme');

@tag('demo-home-root')
export class DemoHomeRoot extends UIElement {
	@provide(ThemeKey) readonly theme = stateTree<Theme>({ mode: 'dark' }); // shared with every descendant
	static override shadowRootOptions = { mode: 'open' } as const; // so <slot> projects children
	protected override template() { return t`<slot></slot>`; }
}

@tag('demo-home-counter')
export class DemoHomeCounter extends UIElement {
	static override styles = css`
		button { padding: .5rem 1rem; border-radius: 999px; border: 0; cursor: pointer; background: #e8def8; color: #1d192b; }
		button.dark { background: #222; color: #fff; }
	`;
	@attribute({ type: Number, reflect: true }) readonly count = stateTree(0); // <demo-home-counter count="3">
	@consume(ThemeKey) readonly theme!: Theme; // nearest ancestor's value

	protected override template() {
		return t`<button class=${this.theme.mode} @click=${() => this.count.set(this.count() + 1)}>Clicked ${this.count()} times</button>`;
	}
}

@tag('demo-home-key-section')
export class DemoHomeKeySection extends UIElement {
	protected override template() {
		return t`
			<section id="key-feature" style="scroll-margin-top: 4rem">
				<h2>A taste</h2>
				<p class="desc">Real custom elements: <code>@attribute</code> mirrors a signal to an HTML attribute, <code>@provide</code> / <code>@consume</code> pass state down the tree, and the button re-renders in place when the count changes.</p>
				<demo-home-root><demo-home-counter count="3"></demo-home-counter></demo-home-root>
			</section>
		`;
	}
}
