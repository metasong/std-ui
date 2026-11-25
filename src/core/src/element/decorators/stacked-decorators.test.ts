import { describe, expect, it } from 'vitest';
import { attribute, defineElement, tag, UIElement } from '../ui-element.js';
import { state } from '../../reactive/index.js';

// `@attribute()` only registers metadata about a field that already is a store, and the decorator-free
// `defineElement()` must register exactly the same attribute defs.

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('@attribute() stacked on a store field', () => {
	it('registers exactly one observed attribute per field', () => {
		@tag('stack-single-def')
		class Foo extends UIElement {
			@attribute({ reflect: true })
			readonly label = state('hi');
		}

		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes).toEqual(['label']);
	});
});

describe('defineElement() - the decorator-free path', () => {
	it('registers the element and mirrors attribute fields, same as @tag + @attribute', async () => {
		class Foo extends UIElement {
			readonly count = state(5);
			readonly label = state('hi');
			readonly internalOnly = state('x');
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
		expect(el.count.get()).toBe(9);
		el.setAttribute('label', 'yo');
		expect(el.label.get()).toBe('yo');

		el.count.set(2);
		await flush();
		expect(el.getAttribute('count')).toBe('2');
		el.remove();
	});

	it('infers the converter from the store value when neither type nor converter is given', () => {
		class Foo extends UIElement {
			readonly active = state(false);
			readonly config = state({ a: 1 });
		}
		defineElement('define-el-infer', Foo, { attributes: { active: { reflect: true }, config: { reflect: true } } });

		const el = document.createElement('define-el-infer') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('active')).toBe(false); // Boolean converter
		expect(el.getAttribute('config')).toBe('{"a":1}'); // Object converter
		el.setAttribute('active', '');
		expect(el.active.get()).toBe(true);
		el.remove();
	});

	it('picks up attributes the element already carries in markup (upgrade path)', () => {
		const host = document.createElement('div');
		host.innerHTML = '<define-el-upgrade count="7"></define-el-upgrade>';
		document.body.appendChild(host);

		class Foo extends UIElement {
			readonly count = state(0);
		}
		defineElement('define-el-upgrade', Foo, { attributes: { count: { type: Number } } });

		const el = host.firstElementChild as Foo;
		expect(el.count.get()).toBe(7);
		host.remove();
	});

	it('accepts a plain field in the attributes map (attribute -> property only)', () => {
		class Foo extends UIElement {
			plain = 3;
		}
		defineElement('define-el-plain', Foo, { attributes: { plain: { type: Number } } });

		const el = document.createElement('define-el-plain') as Foo;
		el.setAttribute('plain', '8');
		expect(el.plain).toBe(8);
	});

	it('shares attribute defs with subclasses', () => {
		class Base extends UIElement {
			readonly count = state(1);
		}
		class Child extends Base {
			readonly label = state('a');
		}
		defineElement('define-el-child', Child, { attributes: { count: { type: Number }, label: {} } });

		const el = document.createElement('define-el-child') as Child;
		el.setAttribute('count', '4');
		el.setAttribute('label', 'z');
		expect(el.count.get()).toBe(4);
		expect(el.label.get()).toBe('z');
	});
});
