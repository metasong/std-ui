// Demonstrates: `classMap` / `styleMap` attribute directives, and `html`.
import { tag, t, UIElement, html, state } from '../../../std-ui/src/index.js';
import { classMap, styleMap } from '../../../std-ui/src/element/template/directives/index.js';

@tag('demo-directives-section')
export class DemoDirectivesSection extends UIElement {
	readonly active = state(false);
	readonly big = state(false);

	protected override template() {
		const classes = { active: this.active(), 'demo-box': true };
		const styles = {
			padding: this.big() ? '1.5rem' : '0.75rem',
			fontSize: this.big() ? '1.125rem' : '1rem',
			transition: 'all 150ms ease',
		};

		return t`
			<h2>Directives</h2>
			<p class="desc"><code>classMap</code> toggles individual classes via <code>classList</code>; <code>styleMap</code> sets individual inline style properties - both can coexist with static text/other classes in the same attribute; <code>html</code> injects raw markup (trusted input only).</p>
			<div class="${classMap(classes)} demo-box" style=${styleMap(styles)}>
				classMap + styleMap controlled box (mixed with static "class"/"style" text)
			</div>
			<div class="demo-actions">
				<button type="button" @click=${() => this.active.set(!this.active())}>toggle active class</button>
				<button type="button" class="tonal" @click=${() => this.big.set(!this.big())}>toggle size style</button>
			</div>
			<div>${html('<em>rendered via <code>html</code></em>')}</div>
		`;
	}
}
