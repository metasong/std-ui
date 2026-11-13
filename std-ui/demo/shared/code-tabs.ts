// `<demo-code-tabs>`: shows source files as tabs, with the live demo (its light-DOM children) rendered below.
//
//   <demo-code-tabs id="signup"><demo-integration-signup></demo-integration-signup></demo-code-tabs>
//
//   import main from './sections/signup.ts?raw';
//   import { setCodeFiles } from '../shared/code-tabs.js';
//   setCodeFiles('#signup', { 'signup.ts': main });
//
// Shadow DOM: the tabs and code live in the shadow root, the demo is projected through a native `<slot>`.
import { state, t, tag, UIElement } from '../../src/index.js';
import { tokenize } from './highlight.js';

export type CodeFiles = Readonly<Record<string, string>>;

@tag('demo-code-tabs')
export class DemoCodeTabs extends UIElement {
	// Not `static shadowRootOptions`: `@tag` defines the element before static fields are initialised, so
	// an element already in the page's HTML would be upgraded (and rendered) into the light DOM first.
	protected override createRenderRoot(): ShadowRoot {
		return this.attachShadow({ mode: 'open' });
	}

	@state() private fileMap: CodeFiles = {};
	@state() private active = '';
	@state() private wrap = false;

	/** Source text by file name; the first file is selected until the user picks another. */
	get files(): CodeFiles { return this.fileMap(); }
	set files(v: CodeFiles) {
		this.fileMap.set(v);
		if (!(this.active() in v)) this.active.set(Object.keys(v)[0] ?? '');
	}

	protected override template() {
		const files = this.fileMap();
		const names = Object.keys(files);
		const active = this.active() in files ? this.active() : names[0] ?? '';
		return t`
			<style>
				:host {
					display: block; margin-block: 1rem; overflow: hidden; container-type: inline-size;
					border: 1px solid var(--md-sys-color-outline-variant, #cac4d0); border-radius: 12px;
				}
				.bar { display: flex; align-items: center; border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0); }
				.tabs { display: flex; flex: 1; min-width: 0; gap: 2px; overflow-x: auto; }
				.icon-btn {
					display: inline-flex; flex: none; align-items: center; justify-content: center; width: 2rem; height: 2rem;
					margin-inline: 0.25rem; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer;
					color: var(--md-sys-color-on-surface-variant, #49454f);
				}
				.icon-btn:hover { background: var(--md-sys-color-surface-container, #f3edf7); }
				.icon-btn[aria-pressed='true'] { color: var(--md-sys-color-primary, #6750a4); background: var(--md-sys-color-secondary-container, #e8def8); }
				.icon-btn svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
				pre.wrap { white-space: pre-wrap; overflow-wrap: anywhere; }
				.tab {
					font: 500 0.8125rem/1 var(--md-ref-typeface-plain, Roboto, sans-serif);
					padding: 0.6rem 0.9rem; border: 0; background: none; cursor: pointer; white-space: nowrap;
					color: var(--md-sys-color-on-surface-variant, #49454f); border-bottom: 2px solid transparent;
				}
				.tab[aria-selected='true'] { color: var(--md-sys-color-primary, #6750a4); border-bottom-color: currentColor; }
				pre {
					margin: 0; padding: 0.75rem 1rem; height: 18rem; min-height: 5rem; overflow: auto; resize: vertical; tab-size: 4;
					font: 400 0.8125rem/1.5 var(--md-ref-typeface-mono, 'Roboto Mono', monospace);
					background: var(--md-sys-color-surface-container, #f3edf7);
				}
				.comment { color: #6b6b76; font-style: italic; }
				.string { color: #0b6e4f; }
				.keyword { color: #7a2fbf; }
				.number { color: #b3261e; }
				.decorator { color: #9c4a00; }
				.demo { padding: 1rem; border-top: 1px solid var(--md-sys-color-outline-variant, #cac4d0); min-width: 0; }
				/* Wide enough: code on the left, the rendered demo on the right. */
				@container (min-width: 56rem) {
					.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
					/* The code column stretches to the row; its panel grows past the default height when the demo is taller. */
					.code { display: flex; flex-direction: column; min-height: 0; }
					pre { flex: 1 1 auto; height: 0; min-height: 18rem; resize: vertical; }
					.demo { border-top: 0; border-left: 1px solid var(--md-sys-color-outline-variant, #cac4d0); }
				}
			</style>
			<div class="layout">
				<div class="code">
					<div class="bar">
						<div class="tabs" role="tablist">
							${names.map(name => t`
								<button class="tab" type="button" role="tab" aria-selected="${String(name === active)}"
									@click=${() => this.active.set(name)}>${name}</button>
							`)}
						</div>
						<button class="icon-btn" type="button" aria-pressed="${String(this.wrap())}" title="Toggle line wrap" aria-label="Toggle line wrap"
							@click=${() => this.wrap.update(w => !w)}>
							<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M120-200v-80h720v80H120Zm0-240v-80h560q50 0 85 35t35 85q0 50-35 85t-85 35H560v80l-120-120 120-120v80h120q17 0 28.500-11.500T720-400q0-17-11.500-28.500T680-440H120Zm0-240v-80h720v80H120Z"/></svg>
						</button>
					</div>
					<pre role="tabpanel" class="${this.wrap() ? 'wrap' : ''}"><code>${tokenize(files[active] ?? '').map(tok => t`<span class="${tok.kind}">${tok.text}</span>`)}</code></pre>
				</div>
				<div class="demo"><slot></slot></div>
			</div>
		`;
	}
}

/** Convenience for page scripts: assign `files` on the `<demo-code-tabs>` matching `selector`. */
export function setCodeFiles(selector: string, files: CodeFiles): void {
	const el = document.querySelector<DemoCodeTabs>(selector);
	if (el) el.files = files;
}
