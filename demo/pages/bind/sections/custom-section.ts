// Custom element property + default `level-change` event.
import { bind, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import './knob-control.js';
import './signal-knob-control.js';

@tag('demo-bind-custom-section')
export class DemoBindCustomSection extends UIElement {
	level = stateTree(2);

	protected override template() {
		return t`
			<section class="demo-bind-block" id="custom">
				<h2>Custom <code>.level</code></h2>
				<p class="desc">
					<code>&lt;demo-bind-knob&gt;</code> updates <code>.level</code> and bubbles
					<code>level-change</code> (the default for a property named <code>level</code>).
				</p>
				<demo-bind-knob .level=${bind(this.level)}></demo-bind-knob>
				<p class="demo-bind-mirror">Parent <code>stateTree()</code> level: <code>${this.level()}</code></p>
				<h3>State property</h3>
				<p class="desc">
					<code>&lt;demo-bind-signal-knob&gt;</code> exposes <code>.level</code> as a <code>stateTree()</code>;
					<code>bind()</code> reads it with <code>()</code> and writes it with <code>.set()</code>.
				</p>
				<demo-bind-signal-knob .level=${bind(this.level)}></demo-bind-signal-knob>
				<div class="demo-actions">
					<button type="button" @click=${() => this.level.set(0)}>set parent level to 0</button>
					<button type="button" class="tonal" @click=${() => this.level.update(n => n + 5)}>parent +5</button>
				</div>
			</section>
		`;
	}
}
