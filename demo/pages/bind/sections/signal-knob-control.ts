// Toy control whose `.level` property is itself a `state()` signal; `bind()` reads it by calling it
// and writes it with `.set()`. Emits `level-change` on user edits only.
import { state, t, tag, UIElement } from '@std-ui/core';

@tag('demo-bind-signal-knob')
export class DemoBindSignalKnob extends UIElement {
	level = state(0);

	#bump(delta: number): void {
		this.level.update(n => n + delta);
		this.dispatchEvent(new Event('level-change', { bubbles: true }));
	}

	protected override template() {
		return t`
			<button type="button" @click=${() => this.#bump(-1)}>−</button>
			<span class="demo-bind-knob__readout">level ${this.level()}</span>
			<button type="button" @click=${() => this.#bump(1)}>+</button>
		`;
	}
}
