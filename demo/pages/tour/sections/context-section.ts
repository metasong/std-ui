// Demonstrates: `createContextKey`, `@provide(key)` / `@consume(key)` (read) —
// a descendant reads an ancestor's reactive value with no prop-drilling.
import { tag, t, UIElement } from '@std-ui/core';
import { store } from '@std-ui/ext';
import { consume, provide, createContextKey } from '@std-ui/ext';

interface Theme { mode: 'light' | 'dark'; }
const ThemeKey = createContextKey<Theme>('demo-theme');

@tag('demo-theme-child')
class DemoThemeChild extends UIElement {
	@consume(ThemeKey) readonly theme!: Theme; // reads as the plain value; decorator-free: defineElement(..., { consume: { theme: ThemeKey } })

	protected override template() {
		return t`<p>Child reads context: mode = <strong>${this.theme.mode}</strong></p>`;
	}
}

@tag('demo-context-section')
export class DemoContextSection extends UIElement {
	@provide(ThemeKey) readonly theme = store<Theme>({ mode: 'light' });

	protected override template() {
		return t`
			<h2>Context</h2>
			<p class="desc"><code>@provide(ThemeKey)</code> on this element provides <code>ThemeKey</code>; the nested <code>&lt;demo-theme-child&gt;</code> below reads it via <code>@consume(ThemeKey)</code> with no attributes/props passed through markup.</p>
			<div class="demo-actions">
				<button type="button" @click="${() => this.theme.set({ mode: this.theme.get().mode === 'light' ? 'dark' : 'light' })}">toggle (parent)</button>
			</div>
			<demo-theme-child></demo-theme-child>
		`;
	}
}
