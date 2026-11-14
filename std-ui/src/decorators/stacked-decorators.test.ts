import { describe, expect, it } from 'vitest';
import { attribute, consume, createContextKey, defineElement, provide, tag, UIElement } from '../ui-element.js';
import { signalState } from '../signal/index.js';

// `@attribute()` and `@provide()` only register metadata about a field that already is a store, so
// stacking them on one field (in either order) must keep working, and the decorator-free
// `defineElement()` must register exactly the same attribute defs.

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

interface Theme {
	mode: string;
}

describe('@attribute() + @provide() stacked on the same store field', () => {
	it('works in either order', async () => {
		const KeyA = createContextKey<number>('stack-a');
		const KeyB = createContextKey<number>('stack-b');

		@tag('stack-attr-ctx')
		class Foo extends UIElement {
			@attribute({ type: Number, reflect: true })
			@provide(KeyA)
			readonly count = signalState(5);

			@provide(KeyB)
			@attribute({ type: Number, reflect: true })
			readonly other = signalState(3);
		}

		const el = document.createElement('stack-attr-ctx') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5');
		expect(el.getAttribute('other')).toBe('3');

		el.setAttribute('count', '9');
		expect(el.count()).toBe(9);

		el.other.set(4);
		await flush();
		expect(el.getAttribute('other')).toBe('4');
		el.remove();
	});

	it('registers exactly one observed attribute per field', () => {
		@tag('stack-single-def')
		class Foo extends UIElement {
			@attribute({ reflect: true })
			readonly label = signalState('hi');
		}

		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes).toEqual(['label']);
	});
});

describe('defineElement() - the decorator-free path', () => {
	it('registers the element and mirrors attribute fields, same as @tag + @attribute', async () => {
		class Foo extends UIElement {
			readonly count = signalState(5);
			readonly label = signalState('hi');
			readonly internalOnly = signalState('x');
		}
		defineElement('define-el-basic', Foo, {
			attributes: { count: { type: Number, reflect: true }, label: {} },
		});

		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes).toEqual(['count', 'label']);

		const el = document.createElement('define-el-basic') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5'); // reflect: true
		expect(el.hasAttribute('label')).toBe(false); // reflect defaults to false
		expect(el.hasAttribute('internal-only')).toBe(false);

		el.setAttribute('count', '9');
		expect(el.count()).toBe(9);
		el.setAttribute('label', 'yo');
		expect(el.label()).toBe('yo');

		el.count.set(2);
		await flush();
		expect(el.getAttribute('count')).toBe('2');
		el.remove();
	});

	it('infers the converter from the store value when neither type nor converter is given', () => {
		class Foo extends UIElement {
			readonly active = signalState(false);
			readonly config = signalState({ a: 1 });
		}
		defineElement('define-el-infer', Foo, { attributes: { active: { reflect: true }, config: { reflect: true } } });

		const el = document.createElement('define-el-infer') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('active')).toBe(false); // Boolean converter
		expect(el.getAttribute('config')).toBe('{"a":1}'); // Object converter
		el.setAttribute('active', '');
		expect(el.active()).toBe(true);
		el.remove();
	});

	it('picks up attributes the element already carries in markup (upgrade path)', () => {
		const host = document.createElement('div');
		host.innerHTML = '<define-el-upgrade count="7"></define-el-upgrade>';
		document.body.appendChild(host);

		class Foo extends UIElement {
			readonly count = signalState(0);
		}
		defineElement('define-el-upgrade', Foo, { attributes: { count: { type: Number } } });

		const el = host.firstElementChild as Foo;
		expect(el.count()).toBe(7);
		host.remove();
	});

	it('rejects a non-store field in the attributes map at compile time', () => {
		class Foo extends UIElement {
			readonly count = signalState(0);
			plain = 3;
		}
		// @ts-expect-error - `plain` is not a store, so it can't mirror an attribute
		void (() => defineElement('define-el-bad', Foo, { attributes: { plain: {} } }));
	});

	it('shares attribute defs with subclasses', () => {
		class Base extends UIElement {
			readonly count = signalState(1);
		}
		class Child extends Base {
			readonly label = signalState('a');
		}
		defineElement('define-el-child', Child, { attributes: { count: { type: Number }, label: {} } });

		const el = document.createElement('define-el-child') as Child;
		el.setAttribute('count', '4');
		el.setAttribute('label', 'z');
		expect(el.count()).toBe(4);
		expect(el.label()).toBe('z');
	});
});

describe('defineElement({ provide }) alongside @provide()', () => {
	it('both feed the same listeners', () => {
		const KeyA = createContextKey<Theme>('both-a');
		const KeyB = createContextKey<Theme>('both-b');

		@tag('both-child')
		class Child extends UIElement {
			@consume(KeyA) readonly a!: Theme;
			@consume(KeyB) readonly b!: Theme;
		}

		class Root extends UIElement {
			@provide(KeyA) readonly a = signalState<Theme>({ mode: 'a' });
			readonly b = signalState<Theme>({ mode: 'b' });
			protected override connect(): void {
				this.appendChild(document.createElement('both-child'));
			}
		}
		defineElement('both-root', Root, { provide: { b: KeyB } });

		const root = document.createElement('both-root') as Root;
		document.body.appendChild(root);
		const child = root.querySelector('both-child') as Child;
		expect(child.a.mode).toBe('a');
		expect(child.b.mode).toBe('b');
		root.remove();
	});
});