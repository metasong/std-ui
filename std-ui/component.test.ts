import { describe, expect, it, vi } from 'vitest';
import { element, UIElement } from './component.js';
import { buildSignalTree } from './signal/tree.js';
import { html } from './template/html.js';

interface State {
	count: number;
}

describe('element() decorator', () => {
	it('registers the class as a custom element under the given tag', () => {
		@element('el-registers')
		class Foo extends UIElement {}

		expect(customElements.get('el-registers')).toBe(Foo);
	});
});

describe('UIElement', () => {
	it('runs connect() once on first connect, which can inject markup', () => {
		const calls: string[] = [];

		@element('el-connect')
		class Foo extends UIElement {
			protected override connect(): void {
				calls.push('connect');
				this.innerHTML = '<span>injected</span>';
			}
		}

		const el = document.createElement('el-connect') as Foo;
		document.body.appendChild(el);
		expect(calls).toEqual(['connect']);
		expect(el.querySelector('span')!.textContent).toBe('injected');
		el.remove();
	});

	it('re-runs connect() on every connect, including after a disconnect', () => {
		const connect = vi.fn();

		@element('el-reconnect')
		class Foo extends UIElement {
			protected override connect = connect;
		}

		const el = document.createElement('el-reconnect') as Foo;
		document.body.appendChild(el);
		el.remove();
		document.body.appendChild(el);
		expect(connect).toHaveBeenCalledTimes(2);
		el.remove();
	});

	it('calls template() immediately on connect and again whenever a signal it reads changes', async () => {
		const tree = buildSignalTree<State>({ count: 0 });
		const renderSpy = vi.fn();

		@element('el-template')
		class Foo extends UIElement {
			protected override template(): void {
				renderSpy(tree.count());
			}
		}

		const el = document.createElement('el-template') as Foo;
		document.body.appendChild(el);
		expect(renderSpy).toHaveBeenCalledTimes(1);
		expect(renderSpy).toHaveBeenLastCalledWith(0);

		tree.count.set(1);
		await flush();
		expect(renderSpy).toHaveBeenLastCalledWith(1);
		el.remove();
	});

	it('renders an html() result returned from template() into the element', () => {
		const tree = buildSignalTree<State>({ count: 7 });

		@element('el-html')
		class Foo extends UIElement {
			protected override template() {
				return html`<em>${tree.count()}</em>`;
			}
		}

		const el = document.createElement('el-html') as Foo;
		document.body.appendChild(el);
		expect(el.querySelector('em')!.textContent).toBe('7');
		el.remove();
	});

	it('calls disconnect() and stops reacting to signals after disconnect', async () => {
		const tree = buildSignalTree<State>({ count: 0 });
		const renderSpy = vi.fn();
		const disconnect = vi.fn();

		@element('el-disconnect')
		class Foo extends UIElement {
			protected override disconnect = disconnect;
			protected override template(): void {
				renderSpy(tree.count());
			}
		}

		const el = document.createElement('el-disconnect') as Foo;
		document.body.appendChild(el);
		el.remove();
		expect(disconnect).toHaveBeenCalledTimes(1);

		renderSpy.mockClear();
		tree.count.set(99);
		await flush();
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('disposes effect()-registered reactions on disconnect', async () => {
		const tree = buildSignalTree<State>({ count: 0 });
		const effectSpy = vi.fn();

		@element('el-effect')
		class Foo extends UIElement {
			protected override connect(): void {
				this.effect(() => {
					effectSpy(tree.count());
				});
			}
		}

		const el = document.createElement('el-effect') as Foo;
		document.body.appendChild(el);
		expect(effectSpy).toHaveBeenCalledTimes(1);

		el.remove();
		effectSpy.mockClear();
		tree.count.set(5);
		await flush();
		expect(effectSpy).not.toHaveBeenCalled();
	});
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
