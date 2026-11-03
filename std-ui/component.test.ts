import { describe, expect, it, vi } from 'vitest';
import { element, UIElement } from './component.js';
import { buildSignalTree, type SignalTree } from './signal/tree.js';
import { html } from './template/html.js';

interface State {
	count: number;
}

let tagCounter = 0;
function uniqueTag(): string {
	return `test-component-${tagCounter++}`;
}

describe('element() decorator', () => {
	it('registers the class as a custom element under the given tag', () => {
		const tag = uniqueTag();

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return buildSignalTree({ count: 0 });
			}
		}

		expect(customElements.get(tag)).toBe(Foo);
	});
});

describe('UIElement', () => {
	it('runs connect() once on first connect, which can inject markup', () => {
		const tag = uniqueTag();
		const calls: string[] = [];

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return buildSignalTree({ count: 0 });
			}
			protected override connect(): void {
				calls.push('connect');
				this.innerHTML = '<span>injected</span>';
			}
		}

		const el = document.createElement(tag) as Foo;
		document.body.appendChild(el);
		expect(calls).toEqual(['connect']);
		expect(el.querySelector('span')!.textContent).toBe('injected');
		el.remove();
	});

	it('re-runs connect() on every connect, including after a disconnect', () => {
		const tag = uniqueTag();
		const connect = vi.fn();

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return buildSignalTree({ count: 0 });
			}
			protected override connect = connect;
		}

		const el = document.createElement(tag) as Foo;
		document.body.appendChild(el);
		el.remove();
		document.body.appendChild(el);
		expect(connect).toHaveBeenCalledTimes(2);
		el.remove();
	});

	it('calls render(state) immediately on connect and again whenever state changes', async () => {
		const tag = uniqueTag();
		const tree = buildSignalTree<State>({ count: 0 });
		const renderSpy = vi.fn();

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return tree;
			}
			protected override render(state: State): void {
				renderSpy(state.count);
			}
		}

		const el = document.createElement(tag) as Foo;
		document.body.appendChild(el);
		expect(renderSpy).toHaveBeenCalledTimes(1);
		expect(renderSpy).toHaveBeenLastCalledWith(0);

		tree.count.set(1);
		await flush();
		expect(renderSpy).toHaveBeenLastCalledWith(1);
		el.remove();
	});

	it('renders an html() result returned from render(state) into the element', () => {
		const tag = uniqueTag();

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return buildSignalTree({ count: 7 });
			}
			protected override render(state: State) {
				return html`<em>${state.count}</em>`;
			}
		}

		const el = document.createElement(tag) as Foo;
		document.body.appendChild(el);
		expect(el.querySelector('em')!.textContent).toBe('7');
		el.remove();
	});

	it('calls disconnect() and stops reacting to state after disconnect', async () => {
		const tag = uniqueTag();
		const tree = buildSignalTree<State>({ count: 0 });
		const renderSpy = vi.fn();
		const disconnect = vi.fn();

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return tree;
			}
			protected override disconnect = disconnect;
			protected override render(state: State): void {
				renderSpy(state.count);
			}
		}

		const el = document.createElement(tag) as Foo;
		document.body.appendChild(el);
		el.remove();
		expect(disconnect).toHaveBeenCalledTimes(1);

		renderSpy.mockClear();
		tree.count.set(99);
		await flush();
		expect(renderSpy).not.toHaveBeenCalled();
	});

	it('disposes effect()-registered reactions on disconnect', async () => {
		const tag = uniqueTag();
		const tree = buildSignalTree<State>({ count: 0 });
		const effectSpy = vi.fn();

		@element(tag)
		class Foo extends UIElement<State> {
			protected override get state(): SignalTree<State> {
				return tree;
			}
			protected override connect(): void {
				this.effect(() => {
					effectSpy(tree.count());
				});
			}
		}

		const el = document.createElement(tag) as Foo;
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
