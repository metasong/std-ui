// Demonstrates: event extensions (`@input.debounce:300`, `@keyup.ctrl+enter.ctrl+y`).
import { tag, t, UIElement } from '@std-ui/core';
import { store } from '@std-ui/ext';
// Registers the `@event.modifier` binding and its extensions.
import '@std-ui/ext';

@tag('demo-event-extensions-section')
export class DemoEventExtensionsSection extends UIElement {
	readonly typed = store('');
	readonly debounced = store('');
	readonly combos = store<string[]>([]);

	protected override template() {
		return t`
			<h2>Event extensions</h2>
			<p class="desc">
				<code>@input.debounce:300</code> runs the handler once typing pauses.
				<code>@keyup.ctrl+enter.ctrl+y</code> runs only for Ctrl+Enter or ctrl+y.
			</p>

			<div class="demo-actions">
				<input
					placeholder="type quickly..."
					@input=${(e: Event) => this.typed.set((e.target as HTMLInputElement).value)}
					@input.debounce:300=${(e: Event) => this.debounced.set((e.target as HTMLInputElement).value)}
				/>
				<span>live: ${this.typed.get()} | debounced: ${this.debounced.get()}</span>
			</div>

			<div class="demo-actions">
				<input
					placeholder="focus, press Ctrl+Enter or ctrl+y"
					@keyup.ctrl+enter.ctrl+y=${(e: KeyboardEvent) =>
						this.combos.set([`${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`, ...this.combos.get()].slice(0, 5))}
				/>
			</div>

			<pre class="demo-log">${this.combos.get().join('\n') || 'matching combos log here'}</pre>
		`;
	}
}
