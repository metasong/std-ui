import { describe, expect, it } from 'vitest';
import { state, tag, UIElement } from '../ui-element.js';
import { buildSignalTree } from '../signal/tree.js';
import { html } from '../template/html.js';

interface ParentState {
	count: number;
}

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('template `.prop` bindings with @state()', () => {
	it('binds a parent property directly to a child `.prop` and re-renders the child template on change', async () => {
		@tag('bind-child')
		class Badge extends UIElement {
			@state() count = 0;

			protected override template() {
				return html`<span class="count">${this.count}</span>`;
			}
		}

		@tag('bind-panel')
		class Panel extends UIElement {
			readonly tree = buildSignalTree<ParentState>({ count: 3 });

			protected override template() {
				return html`<bind-child .count="${this.tree.count()}"></bind-child>`;
			}
		}

		const container = document.createElement('div');
		document.body.appendChild(container);
		const panel = new Panel();
		container.appendChild(panel);
		await flush();

		const badge = panel.querySelector('bind-child') as Badge;
		expect(badge.count).toBe(3);
		expect(badge.hasAttribute('count')).toBe(false);
		expect(badge.querySelector('.count')!.textContent).toBe('3');

		// Changing the parent's own state - not touching the child directly - should flow through
		// the `.count="${this.tree.count()}"` binding into the child's `@state()` field and trigger
		// the child's own `template()` re-render.
		panel.tree.count.set(9);
		await flush();

		expect(badge.count).toBe(9);
		expect(badge.hasAttribute('count')).toBe(false);
		expect(badge.querySelector('.count')!.textContent).toBe('9');
		expect(panel.querySelector('bind-child')).toBe(badge);

		container.remove();
	});
});
