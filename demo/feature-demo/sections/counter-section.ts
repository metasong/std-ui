// Demonstrates: `state`/`computed`, `UIElement.template()` re-rendering on signal change,
// `@click` event binding, `?disabled` boolean-attribute binding.
import { tag, t, UIElement } from '../../../std-ui/src/index.js';
import { state, computed } from '../../../std-ui/src/signal/index.js';

const count = state(0);
const label = computed(() => (count() === 1 ? 'click' : 'clicks'));

@tag('demo-counter-section')
export class DemoCounterSection extends UIElement {
	protected override template() {
		return t`
			<h2>Signals + templates</h2>
			<p class="desc"><code>state</code>, <code>computed</code>, <code>html</code>/<code>render</code> — the template re-renders in place whenever a read signal changes.</p>
			<p><strong>${count()}</strong> ${label()}</p>
			<div class="demo-actions">
				<button type="button" @click=${() => count.update(n => n + 1)}>+1</button>
				<button type="button" class="tonal" @click=${() => count.set(0)} ?disabled=${count() === 0}>reset</button>
			</div>
		`;
	}
}
