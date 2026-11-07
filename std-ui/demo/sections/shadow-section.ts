// Demonstrates: `static shadowRootOptions`, encapsulated styles, `@query()` against `renderRoot`.
import { tag, html, UIElement, state } from '../../src/index.js';
import { query } from '../../src/ui-element.js';

@tag('demo-shadow-chip')
export class DemoShadowChip extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	@state() on = false;

	@query('button') toggle!: HTMLButtonElement | null;

	protected override template() {
		return html`
			<style>
				:host { display: inline-block; }
				button {
					padding: 0.45rem 1rem;
					border-radius: 999px;
					border: 2px solid #5b21b6;
					background: linear-gradient(180deg, #a78bfa, #7c3aed);
					color: #fff;
					font-weight: 600;
					cursor: pointer;
				}
				button[data-off] {
					background: #4b5563;
					border-color: #374151;
				}
			</style>
			<button
				type="button"
				data-off="${this.on ? null : ''}"
				@click="${() => (this.on = !this.on)}"
			>
				${this.on ? 'Encapsulated (shadow)' : 'Click — purple only inside shadow'}
			</button>
		`;
	}

	protected override rendered(): void {
		if (this.on && this.toggle) this.toggle.focus();
	}
}

@tag('demo-shadow-section')
export class DemoShadowSection extends UIElement {
	protected override template() {
		return html`
			<h2>Shadow DOM</h2>
			<p class="desc">
				Set <code>static shadowRootOptions</code> on a <code>UIElement</code> subclass —
				<code>template()</code> renders into <code>shadowRoot</code>; <code>@query()</code> searches
				<code>renderRoot</code>, not the light DOM host.
			</p>
			<p>
				The chip uses shadow-only styles (purple pill). The page-level <code>button</code> rules in
				<code>index.html</code> do not reach it — compare with the ordinary button beside it.
			</p>
			<p>
				<demo-shadow-chip></demo-shadow-chip>
				<button type="button">ordinary page button</button>
			</p>
		`;
	}
}
