// Demonstrates: `@attribute()` (attribute <-> property sync, with `reflect: true`) vs. a plain `store()` field
// (store-backed, no attribute at all).
import { tag, t, UIElement, attribute, css } from '@std-ui/core';
import { store } from '@std-ui/ext';

@tag('demo-attribute-section')
export class DemoAttributeSection extends UIElement {
	static override styles = css`
		:host([theme='dark']) {
			background: var(--std-sys-color-inverse-surface);
			border-color: var(--std-sys-color-outline);
			color: var(--std-sys-color-inverse-on-surface);
		}
		:host([theme='dark']) :is(h2, p) {
			color: var(--std-sys-color-inverse-on-surface);
		}
		:host([theme='dark']) p.desc {
			opacity: 0.88;
		}
		:host([theme='dark']) code {
			background: rgb(255 255 255 / 0.12);
			color: inherit;
		}
	`;
	// Parsed from the `theme`/`count` attributes on first connect (and whenever changed from
	// outside); writes also reflect back onto the attribute since `reflect: true`.
	@attribute({ type: String, reflect: true }) readonly theme = store('light');
	@attribute({ reflect: true }) readonly count = store(0);

	// Store-backed, but never touches an attribute — purely internal UI state.
	readonly expanded = store(false);

	protected override template() {
		return t`
			<h2>Attributes vs. store</h2>
			<p class="desc"><code>@attribute({ reflect: true })</code> mirrors to/from the host's HTML attributes (inspect <code>&lt;demo-attribute-section&gt;</code> in devtools). Toggling <code>theme</code> flips this card via <code>:host([theme="dark"])</code> in <code>static styles</code> — not the whole page (see Context). <code>store()</code> alone stays JS-only.</p>
			<p>
				theme=<code>${this.theme.get()}</code>,
				count=<code>${this.count.get()}</code>
			</p>
			<div class="demo-actions">
				<button type="button" @click=${() => this.theme.update(t => t === 'light' ? 'dark' : 'light')}>toggle theme attribute</button>
				<button type="button" class="tonal" @click=${() => this.count.update(n => n + 1)}>increment count attribute</button>
				<button type="button" class="text" @click=${() => this.expanded.set(!this.expanded.get())}>${this.expanded.get() ? 'hide' : 'show'} internal-only store</button>
			</div>
			${this.expanded.get() ? t`<p><em>This line comes from a plain <code>store()</code> — it never appears as an attribute.</em></p>` : ''}
		`;
	}
}
