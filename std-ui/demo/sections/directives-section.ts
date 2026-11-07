// Demonstrates: `classMap` / `styleMap` attribute directives, and `unsafeHTML`.
import { tag, html, UIElement, state, unsafeHTML } from '../../src/index.js';
import { classMap, styleMap } from '../../src/template/directives/index.js';

@tag('demo-directives-section')
export class DemoDirectivesSection extends UIElement {
	@state() active = false;
	@state() big = false;

	protected override template() {
		const classes = { active: this.active, 'demo-box': true };
		const styles = {
			padding: this.big ? '1.5rem' : '0.5rem',
			fontSize: this.big ? '1.25rem' : '1rem',
			background: this.active ? '#dbeafe' : '#f3f4f6',
			border: this.active ? '2px solid #2563eb' : '2px solid #d1d5db',
			borderRadius: '8px',
			transition: 'all 150ms ease',
		};

		return html`
			<h2>Directives</h2>
			<p class="desc"><code>classMap</code> toggles individual classes via <code>classList</code>; <code>styleMap</code> sets individual inline style properties; <code>unsafeHTML</code> injects raw markup (trusted input only).</p>
			<!--
				styleMap()/classMap() must be the attribute's only interpolation, with no surrounding
				static text (see src/template/directives/style-map.ts): mixing in static text silently
				breaks the directive - it falls back to stringifying the directive object instead of
				actually invoking it - so every style/class here comes from the "styles"/"classes"
				objects below, never from static text appended in the attribute itself.
			-->
			<div class="${classMap(classes)}" style="${styleMap(styles)}">
				classMap + styleMap controlled box
			</div>
			<button type="button" @click="${() => (this.active = !this.active)}">toggle active class</button>
			<button type="button" @click="${() => (this.big = !this.big)}">toggle size style</button>
			<div>${unsafeHTML('<em>rendered via <code>unsafeHTML</code></em>')}</div>
		`;
	}
}
