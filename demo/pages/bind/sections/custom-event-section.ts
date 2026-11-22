// bind() on a custom element whose change event is not the default: `bind(state, { event })`.
import { bind, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import './swatch-control.js';

@tag('demo-bind-custom-event-section')
export class DemoBindCustomEventSection extends UIElement {
	color = stateTree('seagreen');
	lastEvent = stateTree('(none yet)');

	protected override template() {
		return t`
			<section class="demo-bind-block" id="custom-event">
				<h2>Custom event</h2>
				<p class="desc">
					<code>&lt;demo-bind-swatch&gt;</code> has a <code>.color</code> property but fires
					<code>swatch-picked</code>, not the default <code>color-change</code>. Pass
					<code>{ event: 'swatch-picked' }</code> to <code>bind()</code>.
				</p>
				<demo-bind-swatch
					.color=${bind(this.color, { event: 'swatch-picked' })}
					@swatch-picked=${(e: Event) => this.lastEvent.set(String((e as CustomEvent).detail))}
				></demo-bind-swatch>
				<p class="demo-bind-mirror">Model: <code>${this.color()}</code></p>
				<p class="demo-bind-mirror">Last <code>swatch-picked</code> detail: <code>${this.lastEvent()}</code></p>
				<div class="demo-actions">
					<button type="button" @click=${() => this.color.set('tomato')}>set model to tomato</button>
					<button type="button" class="tonal" @click=${() => this.color.set('royalblue')}>set model to royalblue</button>
				</div>
			</section>
		`;
	}
}
