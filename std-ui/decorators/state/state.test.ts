import { describe, expect, it } from 'vitest';
import { state, tag, UIElement } from '../../ui-element.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('@state()', () => {
	it('never touches the host attribute', async () => {
		@tag('state-no-attr')
		class Foo extends UIElement {
			@state() label = 'hi';
		}

		const el = document.createElement('state-no-attr') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('label')).toBe(false);

		el.label = 'bye';
		await flush();
		expect(el.hasAttribute('label')).toBe(false);
		expect(el.label).toBe('bye');
		el.remove();
	});

	it('is readable/writable inside template(), re-rendering when the field changes', async () => {
		const rendered: string[] = [];

		@tag('state-template')
		class Foo extends UIElement {
			@state() label = 'a';
			protected override template(): void {
				rendered.push(this.label);
			}
		}

		const el = document.createElement('state-template') as Foo;
		document.body.appendChild(el);
		expect(rendered).toEqual(['a']);

		el.label = 'b';
		await flush();
		expect(rendered).toEqual(['a', 'b']);
		el.remove();
	});

	it('works on an `accessor` field too', async () => {
		@tag('state-accessor')
		class Foo extends UIElement {
			@state() accessor label = 'a';
		}

		const el = document.createElement('state-accessor') as Foo;
		document.body.appendChild(el);
		expect(el.label).toBe('a');

		el.label = 'b';
		expect(el.label).toBe('b');
		el.remove();
	});

	it('backs a complex-object field with a SignalTree, reading/writing the whole object', async () => {
		@tag('state-obj-tree')
		class Foo extends UIElement {
			@state() config = { a: 1, b: { c: 2 } };
		}

		const el = document.createElement('state-obj-tree') as Foo;
		document.body.appendChild(el);
		expect(el.config).toEqual({ a: 1, b: { c: 2 } });

		el.config = { ...el.config, a: 2 };
		await flush();
		expect(el.config).toEqual({ a: 2, b: { c: 2 } });
		el.remove();
	});

	it('leaves an unrelated nested branch untouched (same object identity) when only a sibling leaf changes', async () => {
		@tag('state-obj-sibling')
		class Foo extends UIElement {
			@state() config = { a: 1, b: { c: 2 } };
		}

		const el = document.createElement('state-obj-sibling') as Foo;
		document.body.appendChild(el);
		const bBefore = el.config.b;

		el.config = { ...el.config, a: 2 }; // only `a` changes; `b`'s leaf (`c`) is unchanged
		await flush();
		expect(el.config.b).toBe(bBefore); // `b`'s branch never recomputed, so its identity is preserved
		el.remove();
	});

	it('works for an array field', () => {
		@tag('state-array')
		class Foo extends UIElement {
			@state() tags: string[] = ['a', 'b'];
		}

		const el = document.createElement('state-array') as Foo;
		document.body.appendChild(el);
		expect(el.tags).toEqual(['a', 'b']);
		el.remove();
	});

	it('registers no observedAttributes at all for a @state()-only class', () => {
		@tag('state-only-class')
		class Foo extends UIElement {
			@state() a = 1;
			@state() b = 2;
		}

		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes ?? []).toEqual([]);
	});
});
