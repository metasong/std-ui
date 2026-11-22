// Demonstrates: `state`/`computed`, `UIElement.template()` re-rendering on signal change,
// `@click` event binding, `?disabled` boolean-attribute binding.
import { tag, t, UIElement } from '@std-ui/core';
import { stateTree, computed } from '@std-ui/core';

const count = stateTree(0);
const label = computed(() => (count() < 2 ? 'click' : 'clicks'));

@tag('demo-counter-section')
export class DemoCounterSection extends UIElement {
	protected override template() {
		return t`
			<h2>Signals + templates</h2>
			<p class="desc"><code>stateTree</code>, <code>computed</code>, <code>html</code>/<code>render</code> — the template re-renders in place whenever a read signal changes.</p>
			<p><strong>${count()}</strong> ${label()}</p>
			<div class="demo-actions">
				<button type="button" @click=${() => count.update(n => n + 1)}>+1</button>
				<button type="button" class="tonal" @click=${() => count.set(0)} ?disabled=${count() === 0}>reset</button>
			</div>
		`;
	}
}
