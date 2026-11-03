/**
 * Executable documentation for signal-drives-html.md — Patterns A, B, and C.
 * Run: npm test -- src/mini-ui/doc/signal-drives-html.example.test.ts
 */
import { describe, expect, it, vi } from 'vitest';
import { element, UIElement } from '../component.js';
import { computed, effect, signal } from '../signal/index.js';
import { buildSignalTree, type SignalTree } from '../signal/tree.js';
import { html } from '../template/html.js';
import { render } from '../template/render.js';

describe('doc: signals drive html render', () => {
	it('Pattern A — effect + render patches DOM in place when signals change', async () => {
		const count = signal(0);
		const label = computed(() => (count() === 1 ? 'click' : 'clicks'));
		const container = document.createElement('div');

		const view = () => html`
			<p><strong>${count()}</strong> ${label()}</p>
			<button ?disabled="${count() >= 10}">+</button>
		`;

		effect(() => {
			render(view(), container);
		});

		const p = container.querySelector('p')!;
		const strong = container.querySelector('strong')!;
		const button = container.querySelector('button')!;

		expect(strong.textContent).toBe('0');
		expect(p.textContent).toContain('clicks');
		expect(button.hasAttribute('disabled')).toBe(false);

		count.set(1);
		await flush();
		expect(container.querySelector('p')).toBe(p);
		expect(container.querySelector('strong')).toBe(strong);
		expect(strong.textContent).toBe('1');
		expect(p.textContent).toContain('click');

		count.set(10);
		await flush();
		expect(button.hasAttribute('disabled')).toBe(true);

		const renderSpy = vi.spyOn(container, 'appendChild');
		count.set(10); // Object.is equal — no notify, no re-render work
		await flush();
		expect(renderSpy).not.toHaveBeenCalled();
		renderSpy.mockRestore();
	});

	it('Pattern B — UIElement wires SignalTree to html render, @click, and firstUpdated', async () => {
		const tag = `doc-counter-${Math.random().toString(36).slice(2)}`;
		type DemoState = { counter: { value: number; max: number } };
		const shared = buildSignalTree<DemoState>({
			counter: { value: 0, max: 10 },
		});

		@element(tag)
		class DocCounter extends UIElement<DemoState> {
			protected override get state(): SignalTree<DemoState> {
				return shared;
			}

			protected override render(state: DemoState) {
				const { value, max } = state.counter;
				return html`
					<span>${value}</span> / ${max}
					<button
						type="button"
						?disabled="${value >= max}"
						@click="${() => shared.counter.value.update(n => n + 1)}"
					>+</button>
				`;
			}

			protected override firstUpdated(_state: DemoState): void {
				this.querySelector('span')!.setAttribute('aria-live', 'polite');
			}
		}

		const el = document.createElement(tag) as DocCounter;
		document.body.appendChild(el);
		const span = el.querySelector('span')!;
		const button = el.querySelector('button')!;

		expect(span.textContent).toBe('0');
		expect(span.getAttribute('aria-live')).toBe('polite');
		expect(button.hasAttribute('disabled')).toBe(false);

		button.click();
		await flush();
		expect(el.querySelector('span')).toBe(span);
		expect(span.textContent).toBe('1');

		shared.counter.value.set(10);
		await flush();
		expect(span.textContent).toBe('10');
		expect(button.hasAttribute('disabled')).toBe(true);

		shared.counter.patch({ max: 20 });
		await flush();
		expect(span.textContent).toBe('10');
		expect(button.hasAttribute('disabled')).toBe(false);

		el.remove();
		shared.counter.value.set(99);
		await flush();
		expect(span.textContent).toBe('10');
	});

	it('Pattern C — firstUpdated registers effect() to patch a static .badge node', async () => {
		const tag = `doc-badge-${Math.random().toString(36).slice(2)}`;
		type ShellState = { title: string; unreadCount: number };
		const shared = buildSignalTree<ShellState>({
			title: 'Inbox',
			unreadCount: 0,
		});

		@element(tag)
		class DocInboxBadge extends UIElement<ShellState> {
			protected override get state(): SignalTree<ShellState> {
				return shared;
			}

			protected override render(state: ShellState) {
				return html`
					<h1>${state.title}</h1>
					<span class="badge"></span>
				`;
			}

			protected override firstUpdated(): void {
				const badge = this.querySelector('.badge') as HTMLElement;

				this.effect(() => {
					badge.textContent = String(this.state().unreadCount);
				});
			}
		}

		const el = document.createElement(tag) as DocInboxBadge;
		document.body.appendChild(el);
		const badge = el.querySelector('.badge')!;
		const heading = el.querySelector('h1')!;

		expect(badge.textContent).toBe('0');
		expect(heading.textContent).toBe('Inbox');

		shared.unreadCount.set(3);
		await flush();
		expect(badge.textContent).toBe('3');
		expect(el.querySelector('.badge')).toBe(badge);

		shared.title.set('Messages');
		await flush();
		expect(heading.textContent).toBe('Messages');
		expect(badge.textContent).toBe('3');

		el.remove();
		shared.unreadCount.set(99);
		await flush();
		expect(badge.textContent).toBe('3');
	});
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
