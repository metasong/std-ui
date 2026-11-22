// Demonstrates: `static shadowRootOptions`, encapsulated styles, `@query()` against `renderRoot`.
import { css, tag, t, UIElement, query } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';

@tag('demo-shadow-chip')
export class DemoShadowChip extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	readonly on = stateTree(false);

	@query('button') toggle!: HTMLButtonElement | null;

	protected override template() {
		return t`
			<style>
				:host { display: inline-block; }
				button {
					font: inherit;
					font-weight: 500;
					font-size: 0.875rem;
					padding: 0.625rem 1.5rem;
					border-radius: 9999px;
					border: none;
					background: var(--std-sys-color-primary, #6750a4);
					color: var(--std-sys-color-on-primary, #fff);
					cursor: pointer;
					box-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15);
				}
				button[data-off] {
					background: var(--std-sys-color-surface-container-highest, #e6e0e9);
					color: var(--std-sys-color-on-surface-variant, #49454f);
					box-shadow: none;
				}
			</style>
			<button
				type="button"
				data-off=${this.on() ? null : ''}
				@click=${() => this.on.set(!this.on())}
			>
				${this.on() ? 'Encapsulated (shadow)' : 'Click — themed only inside shadow'}
			</button>
		`;
	}

	protected override updated(): void {
		if (this.on() && this.toggle) this.toggle.focus();
	}
}

@tag('demo-shadow-section')
export class DemoShadowSection extends UIElement {
	static override styles = css`
		p {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
			align-items: center;
		}
	`;

	protected override template() {
		return t`
			<h2>Shadow DOM</h2>
			<p class="desc">
				Set <code>static shadowRootOptions</code> on a <code>UIElement</code> subclass —
				<code>template()</code> renders into <code>shadowRoot</code>; <code>@query()</code> searches
				<code>renderRoot</code>, not the light DOM host.
			</p>
			<p>
				The chip uses shadow-only Std-styled rules. Global <code>button</code> styles from
				<code>demo-components.css</code> do not reach it — compare with the page button beside it.
			</p>
			<p>
				<demo-shadow-chip></demo-shadow-chip>
				<button type="button">ordinary page button</button>
			</p>
		`;
	}
}
