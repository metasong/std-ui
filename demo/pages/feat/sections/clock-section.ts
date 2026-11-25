// A custom `UIFeat` (clock with timer cleanup) composed with a ready-made one (`HotkeyFeat`) in field initializers.
import { t, tag, UIElement, UIFeat } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import { HotkeyFeat } from '@std-ui/ext';

class ClockFeat extends UIFeat {
	readonly now = stateTree(Date.now());
	readonly running = stateTree(true);

	protected override connected() {
		// Re-runs on every connect; the effect is disposed on disconnect, and so is the interval via the cleanup.
		this.effect((onCleanup) => {
			if (!this.running.get()) return;
			const id = setInterval(() => this.now.set(Date.now()), 1000);
			onCleanup(() => clearInterval(id));
		});
	}

	toggle(): void {
		this.running.set(!this.running.peek());
	}
}

@tag('demo-feat-clock')
export class DemoFeatClock extends UIElement {
	readonly #clock = new ClockFeat(this);
	// Space toggles the clock while this element (or a child) has focus.
	readonly #keys = new HotkeyFeat(this, { ' ': (e) => { e.preventDefault(); this.#clock.toggle(); } });

	protected override template() {
		return t`
			<div tabindex="0">
				<time>${new Date(this.#clock.now.get()).toLocaleTimeString()}</time>
				<button type="button" @click=${() => this.#clock.toggle()}>${this.#clock.running.get() ? 'pause' : 'resume'}</button>
				<small>focus here and press Space</small>
			</div>
		`;
	}
}

@tag('demo-feat-clock-section')
export class DemoFeatClockSection extends UIElement {
	protected override template() {
		return t`
			<section id="clock">
				<h2>Feature objects</h2>
				<p class="desc">
					<code>ClockFeat</code> owns its signals, timer and cleanup; <code>HotkeyFeat</code> comes from ext.
					Both are created in field initializers, so the element class only wires them together.
					Remove the element and the interval and key listener are gone.
				</p>
				<demo-feat-clock></demo-feat-clock>
			</section>
		`;
	}
}
