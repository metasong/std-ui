// Demonstrates: interpolation in text-only elements - `<title>`, `<textarea>`, `<style>` and `<script>` bodies.
// The HTML parser reads these bodies as plain text, so every `${}` in one is joined with the static text
// into a single string and set as the element's `textContent` (values are never parsed as markup).
import { tag, t, UIElement } from '@std-ui/core';
import { store } from '@std-ui/ext';

@tag('demo-text-only-section')
export class DemoTextOnlySection extends UIElement {
	readonly name = store('std-ui');
	readonly hue = store(210);
	readonly note = store('<b>not bold</b> - values are text, never markup');

	readonly readBackText = store('');

	/** The data block is a normal DOM node: read its current text and parse it (it never executes). */
	private readonly readBack = () => {
		const script = this.querySelector<HTMLScriptElement>('#text-only-data')!;
		const parsed = JSON.parse(script.textContent!) as { name: string; hue: number };
		this.readBackText.set(`parsed from the DOM: name = ${JSON.stringify(parsed.name)}, hue = ${parsed.hue}`);
	};

	protected override template() {
		const data = JSON.stringify({ name: this.name.get(), hue: this.hue.get() }, null, 2);
		return t`
			<h2>Text-only elements</h2>
			<p class="desc">
				<code>&lt;title&gt;</code>, <code>&lt;textarea&gt;</code>, <code>&lt;style&gt;</code> and
				<code>&lt;script&gt;</code> hold plain text, so several <code>\${}</code> plus static text become one string.
			</p>

			<div class="demo-actions">
				<label>name <input .value=${this.name.get()} @input=${(e: Event) => this.name.set((e.target as HTMLInputElement).value)} /></label>
				<label>
					hue
					<input type="range" min="0" max="360" .value=${this.hue.get()}
						@input=${(e: Event) => this.hue.set(Number((e.target as HTMLInputElement).value))} />
				</label>
			</div>

			<!-- <title>: normally hidden by the browser; shown here so the joined text is visible. -->
			<style>
				.text-only-sample { padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid hsl(${this.hue.get()} 60% 50%); }
				.text-only-sample .swatch { background: hsl(${this.hue.get()} 70% 45%); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; }
				.text-only-sample title { display: block; font-weight: 600; }
			</style>
			<div class="text-only-sample">
				<title>Hello ${this.name.get()}, hue ${this.hue.get()}&deg; (&amp; entities in static text decode)</title>
				<span class="swatch">live &lt;style&gt;: the colors follow the slider</span>
			</div>

			<p>&lt;textarea&gt; default value (type in it: later renders no longer overwrite what you typed):</p>
			<textarea rows="2" cols="40">Notes for ${this.name.get()}</textarea>

			<p>Inert <code>&lt;script type="application/json"&gt;</code> data block (never executes):</p>
			<script type="application/json" id="text-only-data">${data}</script>
			<div class="demo-actions">
				<button type="button" @click=${this.readBack}>read it back with JSON.parse</button>
			</div>
			<pre class="demo-log">${this.readBackText.get() || 'press the button: the script element is parsed, not the signals'}</pre>

			<p>Markup in a value stays text:</p>
			<div class="text-only-sample"><title>${this.note.get()}</title></div>
		`;
	}
}
