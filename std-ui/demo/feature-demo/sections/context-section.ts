// Demonstrates: `createContextKey`, `@state({ contextKey })` (provide) and `@consume()` (read) —
// a descendant reads an ancestor's reactive value with no prop-drilling.
import { tag, t, UIElement, state } from '../../../src/index.js';
import { consume, createContextKey } from '../../../src/ui-element.js';

interface Theme { mode: 'light' | 'dark'; }
const ThemeKey = createContextKey<Theme>('demo-theme');

@tag('demo-theme-child')
class DemoThemeChild extends UIElement {
	@consume(ThemeKey) theme!: Theme;

	protected override template() {
		return t`<p>Child reads context: mode = <strong>${this.theme.mode}</strong></p>`;
	}
}

@tag('demo-context-section')
export class DemoContextSection extends UIElement {
	@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'light' };

	protected override template() {
		return t`
			<h2>Context</h2>
			<p class="desc"><code>@state({ contextKey })</code> on this element provides <code>ThemeKey</code>; the nested <code>&lt;demo-theme-child&gt;</code> below reads it via <code>@consume()</code> with no attributes/props passed through markup.</p>
			<div class="demo-actions">
				<button type="button" @click="${() => this.theme.set({ mode: this.theme().mode === 'light' ? 'dark' : 'light' })}">toggle (parent)</button>
			</div>
			<demo-theme-child></demo-theme-child>
		`;
	}
}
