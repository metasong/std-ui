// Demonstrates: `classMap` / `styleMap` attribute directives, and `unsafeHtml`.
import { tag, t, UIElement, unsafeHtml } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { classMap, styleMap } from '@std-ui/core';

@tag('demo-directives-section')
export class DemoDirectivesSection extends UIElement {
	readonly active = stateTree(false);
	readonly big = stateTree(false);

	protected override template() {
		const classes = { active: this.active.get(), 'demo-box': true };
		const styles = {
			padding: this.big.get() ? '1.5rem' : '0.75rem',
			fontSize: this.big.get() ? '1.125rem' : '1rem',
			transition: 'all 150ms ease',
		};

		return t`
			<h2>Directives</h2>
			<p class="desc"><code>classMap</code> toggles individual classes via <code>classList</code>; <code>styleMap</code> sets individual inline style properties - both can coexist with static text/other classes in the same attribute; <code>unsafeHtml</code> injects raw markup (trusted input only).</p>
			<div class="${classMap(classes)} demo-box" style=${styleMap(styles)}>
				classMap + styleMap controlled box (mixed with static "class"/"style" text)
			</div>
			<div class="demo-actions">
				<button type="button" @click=${() => this.active.set(!this.active.get())}>toggle active class</button>
				<button type="button" class="tonal" @click=${() => this.big.set(!this.big.get())}>toggle size style</button>
			</div>
			<div>${unsafeHtml('<em>rendered via <code>unsafeHtml</code></em>')}</div>
		`;
	}
}
