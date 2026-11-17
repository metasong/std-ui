// Demonstrates: event modifiers (`@click.once`, `.prevent`, `.stop`, `.self`, `.stop-immediate`)
// and single-entry bindings (`class.name`, `style.prop`).
import { tag, t, css, UIElement, state, withEventOptions } from '../../../std-ui/src/index.js';
// Registers the `class.name` / `style.prop` bindings used below.
import '../../../std-ui-ext/src/index.js';

@tag('demo-bindings-section')
export class DemoBindingsSection extends UIElement {
	static override styles = css`
		.demo-self {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 0.75rem;
			border: 1px dashed var(--md-sys-color-outline);
			border-radius: var(--md-shape-corner-small, 8px);
		}

		.demo-log {
			margin: 0.75rem 0 0;
			min-height: 5.5em;
			padding: 0.5rem 0.75rem;
			font-family: 'Roboto Mono', ui-monospace, monospace;
			font-size: 0.8rem;
			background: var(--md-sys-color-surface-container-high);
			border-radius: 4px;
			white-space: pre-wrap;
		}
	`;

	readonly active = state(false);
	readonly hue = state(210);
	readonly log = state<string[]>([]);

	private note(message: string) {
		this.log.set([message, ...this.log()].slice(0, 6));
	}

	// Handlers carrying an `options` property: `addEventListener` options without modifiers.
	// With std-ui-ext (imported above) they override anything set by `.capture` / `.once` / `.passive`.
	private readonly onceHandler = Object.assign(
		() => this.note('handler.options { once }: fired (and removed)'),
		{ options: { once: true } satisfies AddEventListenerOptions },
	);
	private readonly captureHandler = withEventOptions(
		() => this.note('handler.options { capture }: runs BEFORE the inner click'),
		{ capture: true }
	);
	// `.once` modifier is overridden by `options.once = false`: keeps firing.
	private readonly overrideHandler = withEventOptions(
		() => this.note('modifier .once overridden by options { once: false }: still firing'),
		{ once: false }
	);

	protected override template() {
		return t`
			<h2>Binding modifiers</h2>
			<p class="desc">
				<code>@event.modifier</code> adds <code>once</code>, <code>prevent</code>, <code>stop</code>,
				<code>stop-immediate</code> and <code>self</code> without handler boilerplate.
				<code>class.name</code> / <code>style.prop</code> bind one class or style property and leave the rest alone.
			</p>

			<div class="demo-actions">
				<button type="button" @click.once=${() => this.note('@click.once: fired (and removed)')}>
					@click.once
				</button>
				<form @submit.prevent=${() => this.note('@submit.prevent: no page reload')}>
					<button type="submit" class="tonal">@submit.prevent</button>
				</form>
			</div>

			<div class="demo-actions" @click=${() => this.note('outer: reached the parent')}>
				<button type="button" @click.stop=${() => this.note('@click.stop: parent not notified')}>
					@click.stop
				</button>
				<button type="button" @click=${() => this.note('plain click: bubbles to the parent')}>
					plain click
				</button>
				<span
					class="demo-self"
					@click.self=${() => this.note('@click.self: clicked the span itself')}
				>
					@click.self <button type="button" class="tonal">inner (ignored)</button>
				</span>
			</div>

			<div class="demo-actions">
				<button type="button" @click=${this.onceHandler}>handler.options once</button>
				<span class="demo-self" @click=${this.captureHandler}>
					capture on parent
					<button type="button" class="tonal" @click=${() => this.note('inner click')}>inner</button>
				</span>
				<button type="button" @click.once=${this.overrideHandler}>.once overridden by options</button>
			</div>

			<div class="demo-actions">
				<button
					type="button"
					class.active=${this.active()}
					style.background=${this.active() ? `hsl(${this.hue()} 70% 45%)` : null}
					style.color=${this.active() ? 'white' : null}
					style.--hue=${this.hue()}
					@click=${() => this.active.set(!this.active())}
				>
					class.active + style.background
				</button>
				<label>
					hue
					<input
						type="range"
						min="0"
						max="360"
						.value=${this.hue()}
						@input=${(e: Event) => this.hue.set(Number((e.target as HTMLInputElement).value))}
					/>
				</label>
			</div>

			<pre class="demo-log">${this.log().join('\n') || 'events log here'}</pre>
		`;
	}
}
