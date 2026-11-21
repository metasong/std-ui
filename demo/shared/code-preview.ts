// `<code-preview>`: shows source files as tabs, with the live demo (its light-DOM children) rendered below.
//
//   <code-preview .files=${{ 'signup.ts': source }}><my-demo></my-demo></code-preview>
//
//   (`source` typically comes from a `?raw` import.)
//
// Shadow DOM: the tabs and code live in the shadow root, the demo is projected through a native `<slot>`.
import { bind, classMap, css, svg, t, tag, UIElement, state } from '@std-ui/core';
import { tokenize } from './highlight.js';

export type CodeFiles = Readonly<Record<string, string>>;
@tag('code-preview')
export class CodePreview extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	static override styles = css`
		:host {
			display: block; margin-block: 0 1.25rem; overflow: hidden; container-type: inline-size; scroll-margin-top: 4rem;
			background: var(--std-sys-color-surface-container-lowest, #fff); box-shadow: var(--std-elevation-1);
			border: 1px solid var(--std-sys-color-outline-variant, #cac4d0); border-radius: var(--std-shape-corner-medium, 12px);
		}
		.bar { display: flex; align-items: center; border-bottom: 1px solid var(--std-sys-color-outline-variant, #cac4d0); }
		.tabs { display: flex; flex: 1; min-width: 0; gap: 2px; overflow-x: auto; }
		.icon-btn {
			position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; width: 2rem; height: 2rem;
			margin-inline: 0.25rem; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer;
			color: var(--std-sys-color-on-surface-variant, #49454f);
		}
		.icon-btn:hover { background: var(--std-sys-color-surface-container, #f3edf7); }
		.icon-btn input { position: absolute; opacity: 0; pointer-events: none; }
		.icon-btn:has(input:checked) { color: var(--std-sys-color-primary, #6750a4); background: var(--std-sys-color-secondary-container, #e8def8); }
		.icon-btn:has(input:focus-visible) { outline: 2px solid var(--std-sys-color-primary, #6750a4); outline-offset: 2px; }
		.icon-btn svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
		pre.wrap { white-space: pre-wrap; overflow-wrap: anywhere; }
		.tab {
			font: 500 0.8125rem/1 var(--std-ref-typeface-plain, Roboto, sans-serif);
			position: relative; padding: 0.6rem 0.9rem; cursor: pointer; white-space: nowrap;
			color: var(--std-sys-color-on-surface-variant, #49454f); border-bottom: 2px solid transparent;
		}
		/* Native radio group does the selection and arrow-key navigation; the input itself is hidden. */
		.tab input { position: absolute; opacity: 0; pointer-events: none; }
		.tab:has(input:checked) { color: var(--std-sys-color-primary, #6750a4); border-bottom-color: currentColor; }
		.tab:has(input:focus-visible) { outline: 2px solid var(--std-sys-color-primary, #6750a4); outline-offset: -2px; }
		pre {
			margin: 0; padding: 0.75rem 1rem; height: 18rem; min-height: 5rem; overflow: auto; resize: vertical; tab-size: 4;
			font: 400 0.8125rem/1.5 var(--std-ref-typeface-mono, 'Roboto Mono', monospace);
			background: var(--std-sys-color-surface-container, #f3edf7);
		}
		.comment { color: #6b6b76; font-style: italic; }
		.string { color: #0b6e4f; }
		.keyword { color: #7a2fbf; }
		.number { color: #b3261e; }
		.decorator { color: #9c4a00; }
		::slotted(*) { display: block; }
		.demo { padding: 1.25rem 1.5rem; border-top: 1px solid var(--std-sys-color-outline-variant, #cac4d0); min-width: 0; }
		/* Wide enough: code on the left, the rendered demo on the right. */
		@container (min-width: 56rem) {
			.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
			/* The code column stretches to the row; its panel grows past the default height when the demo is taller. */
			.code { display: flex; flex-direction: column; min-height: 0; }
			pre { flex: 1 1 auto; height: 0; min-height: 18rem; resize: vertical; }
			.demo { border-top: 0; border-left: 1px solid var(--std-sys-color-outline-variant, #cac4d0); }
		}
	`;

	/** Source text by file name (set with `.files=${...}`); the first file is selected until the user picks another. */
	readonly files = state<CodeFiles>({});
	private readonly active = state('');
	private readonly wrap = state(false);

	protected override template() {
		const files = this.files();
		const names = Object.keys(files);
		const active = this.active() in files ? this.active() : names[0] ?? '';
		return t`
			<div class="layout">
				<div class="code">
					<div class="bar">
						<div class="tabs" role="radiogroup" aria-label="Source files">
							${names.map(name => t`
								<label class="tab">
									<input type="radio" name="file"
										.checked=${bind({ get: () => name === active, set: v => v && this.active.set(name) })} />
									${name}
								</label>
							`)}
						</div>
						<label class="icon-btn" title="Toggle line wrap">
							<input type="checkbox" aria-label="Toggle line wrap" .checked=${bind(this.wrap)} />
							${svg`<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M120-200v-80h720v80H120Zm0-240v-80h560q50 0 85 35t35 85q0 50-35 85t-85 35H560v80l-120-120 120-120v80h120q17 0 28.500-11.500T720-400q0-17-11.500-28.500T680-440H120Zm0-240v-80h720v80H120Z"/></svg>`}
						</label>
					</div>
					<pre role="tabpanel" class="${classMap({ wrap: this.wrap() })}"><code>${tokenize(files[active] ?? '').map(tok => t`<span class="${tok.kind}">${tok.text}</span>`)}</code></pre>
				</div>
				<div class="demo"><slot></slot></div>
			</div>
		`;
	}
}

