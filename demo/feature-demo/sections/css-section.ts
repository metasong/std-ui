// Demonstrates: `css` tagged templates + `static styles` — shadow-DOM `adoptedStyleSheets` vs.
// light-DOM `@scope (tag-name)` (shared once across every instance, not re-parsed per instance).
import { css, tag, t, UIElement, state } from '../../../std-ui/src/index.js';

// Shared by every `demo-css-chip` instance via `adoptedStyleSheets` — one `CSSStyleSheet`, never
// re-parsed, and naturally scoped by the shadow boundary, so `:host` is used as-is.
const chipStyles = css`
	:host { display: inline-flex; }
	button {
		font: inherit;
		font-weight: 500;
		font-size: 0.875rem;
		padding: 0.625rem 1.5rem;
		border-radius: 9999px;
		border: none;
		background: var(--md-sys-color-tertiary, #7d5260);
		color: var(--md-sys-color-on-tertiary, #fff);
		cursor: pointer;
	}
`;

@tag('demo-css-chip')
export class DemoCssChip extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;
	static override styles = chipStyles;

	readonly count = state(0);

	protected override template() {
		return t`<button type="button" @click=${() => this.count.update(n => n + 1)}>clicked ${this.count()}×</button>`;
	}
}

// Shared by every `demo-css-badge` instance too — but there's no shadow root to hold an
// `adoptedStyleSheets` list, so this one sheet is instead adopted onto `document`, once per tag
// name, wrapped in `@scope (demo-css-badge) { ... }`. `:host` is rewritten to `:scope` under the
// hood so this literal reads the same either way — see `src/element/template/tag-funcs/css/css.md`.
const badgeStyles = css`
	:host {
		display: inline-block;
		margin: 0 0.35rem 0.35rem 0;
		padding: 0.2rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--md-shape-corner-full, 9999px);
		background: var(--md-sys-color-tertiary-container, #ffd8e4);
		color: var(--md-sys-color-on-tertiary-container, #31101d);
	}
`;

@tag('demo-css-badge')
export class DemoCssBadge extends UIElement {
	static override styles = badgeStyles;
}

@tag('demo-css-section')
export class DemoCssSection extends UIElement {
	protected override template() {
		return t`
			<h2>CSS templates</h2>
			<p class="desc">
				<code>css\`...\`</code> tags a literal as CSS (cached, composable, rejects raw strings —
				use <code>unsafeCSS()</code> to opt in). <code>static styles</code> on a
				<code>UIElement</code> applies it as a real <code>CSSStyleSheet</code>: adopted via
				<code>adoptedStyleSheets</code> for a shadow root (shared by reference, one instance
				below), or — with no shadow boundary to hold it — adopted onto <code>document</code>
				once per tag, wrapped in <code>@scope (tag-name)</code> so it still can't leak to
				unrelated markup, no matter how many instances share it.
			</p>
			<p>
				<demo-css-chip></demo-css-chip>
				<demo-css-chip></demo-css-chip>
			</p>
			<p class="desc">
				Five <code>&lt;demo-css-badge&gt;</code> light-DOM instances below share a single
				<code>@scope</code>-wrapped stylesheet on <code>document</code> — open devtools and
				check <code>document.adoptedStyleSheets</code> (or a fallback <code>&lt;style&gt;</code>
				in <code>&lt;head&gt;</code>) for exactly one entry mentioning <code>demo-css-badge</code>.
			</p>
			<p>
				${[1, 2, 3, 4, 5].map(n => t`<demo-css-badge>badge ${n}</demo-css-badge>`)}
			</p>
		`;
	}
}
