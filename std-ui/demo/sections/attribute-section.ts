// Demonstrates: `@attribute()` (attribute <-> property sync, with `reflect: true`) vs. `@state()`
// (store-backed, no attribute at all).
import { tag, html, UIElement, attribute, state } from '../../src/index.js';

@tag('demo-attribute-section')
export class DemoAttributeSection extends UIElement {
	// Parsed from the `theme`/`count` attributes on first connect (and whenever changed from
	// outside); writes also reflect back onto the attribute since `reflect: true`.
	@attribute({ type: String, reflect: true }) theme = 'light';
	@attribute({ type: Number, reflect: true }) count = 0;

	// Store-backed, but never touches an attribute — purely internal UI state.
	@state() expanded = false;

	protected override template() {
		return html`
			<h2>Attributes vs. state</h2>
			<p class="desc"><code>@attribute({ reflect: true })</code> mirrors to/from the host's HTML attributes (inspect this element in devtools); <code>@state()</code> stays JS-only.</p>
			<p>
				theme=<code>${this.theme}</code>,
				count=<code>${this.count}</code>
			</p>
			<div class="demo-actions">
				<button type="button" @click="${() => (this.theme = this.theme === 'light' ? 'dark' : 'light')}">toggle theme attribute</button>
				<button type="button" class="tonal" @click="${() => (this.count += 1)}">increment count attribute</button>
				<button type="button" class="text" @click="${() => (this.expanded = !this.expanded)}">${this.expanded ? 'hide' : 'show'} internal-only state</button>
			</div>
			${this.expanded ? html`<p><em>This line comes from <code>@state()</code> — it never appears as an attribute.</em></p>` : ''}
		`;
	}
}
