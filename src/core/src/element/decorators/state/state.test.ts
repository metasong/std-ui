import { describe, expect, it } from 'vitest';
import { tag, UIElement } from '../../ui-element.js';
import { state } from '../../../reactive/index.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

// There is no `@state()` decorator anymore: a reactive field is just a `state(...)`, so its
// type (`SignalState<T>`) is right from the declaration and needs no decorator to wire it.
describe('state() fields on a UIElement', () => {
	it('never touches the host attribute', async () => {
		@tag('state-no-attr')
		class Foo extends UIElement {
			readonly label = state('hi');
		}

		const el = document.createElement('state-no-attr') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('label')).toBe(false);

		el.label.set('bye');
		await flush();
		expect(el.hasAttribute('label')).toBe(false);
		expect(el.label()).toBe('bye');
		el.remove();
	});

	it('is readable/writable inside template(), re-rendering when the field changes', async () => {
		const rendered: string[] = [];

		@tag('state-template')
		class Foo extends UIElement {
			readonly label = state('a');
			protected override template(): void {
				rendered.push(this.label());
			}
		}

		const el = document.createElement('state-template') as Foo;
		document.body.appendChild(el);
		expect(rendered).toEqual(['a']);

		el.label.set('b');
		await flush();
		expect(rendered).toEqual(['a', 'b']);
		el.remove();
	});

	it('gives each instance its own store', () => {
		@tag('state-per-instance')
		class Foo extends UIElement {
			readonly count = state(0);
		}

		const a = document.createElement('state-per-instance') as Foo;
		const b = document.createElement('state-per-instance') as Foo;
		a.count.set(5);
		expect(b.count()).toBe(0);
	});

	it('types a boolean field as a writable store (set(true) / set(false))', () => {
		class Foo extends UIElement {
			readonly on = state(false);
		}
		void Foo;
		const store = state(false);
		store.set(true);
		expect(store()).toBe(true);
	});

	it('backs a complex-object field with a tree, reading/writing the whole object', async () => {
		@tag('state-obj-tree')
		class Foo extends UIElement {
			readonly config = state({ a: 1, b: { c: 2 } });
		}

		const el = document.createElement('state-obj-tree') as Foo;
		document.body.appendChild(el);
		expect(el.config.deep()).toEqual({ a: 1, b: { c: 2 } });

		el.config.set({ ...el.config.peek(), a: 2 });
		await flush();
		expect(el.config.deep()).toEqual({ a: 2, b: { c: 2 } });
		el.remove();
	});

	it('leaves an unrelated nested branch untouched (same object identity) when only a sibling leaf changes', async () => {
		@tag('state-obj-sibling')
		class Foo extends UIElement {
			readonly config = state({ a: 1, b: { c: 2 } });
		}

		const el = document.createElement('state-obj-sibling') as Foo;
		document.body.appendChild(el);
		const bBefore = el.config.deep().b;

		el.config.set({ ...el.config.peek(), a: 2 }); // only `a` changes; `b`'s leaf (`c`) is unchanged
		await flush();
		expect(el.config.deep().b).toBe(bBefore); // `b`'s branch never recomputed, so its identity is preserved
		el.remove();
	});

	it('works for an array field', () => {
		@tag('state-array')
		class Foo extends UIElement {
			readonly tags = state<string[]>(['a', 'b']);
		}

		const el = document.createElement('state-array') as Foo;
		document.body.appendChild(el);
		expect(el.tags.deep()).toEqual(['a', 'b']);
		el.remove();
	});

	it('registers no observedAttributes at all for a store-only class', () => {
		@tag('state-only-class')
		class Foo extends UIElement {
			readonly a = state(1);
			readonly b = state(2);
		}

		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes ?? []).toEqual([]);
	});
});
