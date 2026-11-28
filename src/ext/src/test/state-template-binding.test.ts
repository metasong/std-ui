import { describe, expect, it } from 'vitest';
import { tag, UIElement, t } from '@std-ui/core';
import { store } from '../reactive/store/index.js';

interface ParentState {
	count: number;
}

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('template `.prop` bindings with state fields', () => {
	it('binds a parent property directly to a child `.prop` and re-renders the child template on change', async () => {
		@tag('bind-child')
		class Badge extends UIElement {
			readonly count = store(0);

			protected override template() {
				return t`<span class="count">${this.count.get()}</span>`;
			}
		}

		@tag('bind-panel')
		class Panel extends UIElement {
			readonly tree = store<ParentState>({ count: 3 });

			protected override template() {
				return t`<bind-child .count=${this.tree.count.get()}></bind-child>`;
			}
		}

		const container = document.createElement('div');
		document.body.appendChild(container);
		const panel = new Panel();
		container.appendChild(panel);
		await flush();

		const badge = panel.querySelector('bind-child') as Badge;
		expect(badge.count.get()).toBe(3);
		expect(badge.hasAttribute('count')).toBe(false);
		expect(badge.querySelector('.count')!.textContent).toBe('3');

		// Changing the parent's own state - not touching the child directly - should flow through
		// the `.count=${this.tree.count()}` binding into the child's `state` field and trigger
		// the child's own `template()` re-render.
		panel.tree.count.set(9);
		await flush();

		expect(badge.count.get()).toBe(9);
		expect(badge.hasAttribute('count')).toBe(false);
		expect(badge.querySelector('.count')!.textContent).toBe('9');
		expect(panel.querySelector('bind-child')).toBe(badge);

		container.remove();
	});
});
