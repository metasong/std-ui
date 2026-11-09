import { describe, expect, it } from 'vitest';
import { attribute, state, tag, UIElement } from '../ui-element.js';

// `@state()` and `@attribute()` are allowed to be stacked on the same field, but stacking them
// shouldn't throw or corrupt the field either - whichever decorator is closer to the field (runs
// first) owns the actual store; the other is a transparent no-op for storage, while `@attribute()`
// still always registers its `AttributeDef` regardless of order (see `./field-store.ts`).

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('@state() + @attribute() stacked on the same field', () => {
	it('@attribute() closer to the field (runs first) still syncs the attribute', async () => {
		@tag('stack-state-over-attr-plain')
		class Foo extends UIElement {
			@state()
			@attribute({ type: Number, reflect: true })
			count = 5;
		}

		const el = document.createElement('stack-state-over-attr-plain') as Foo;
		document.body.appendChild(el);
		expect(el.count()).toBe(5);
		expect(el.getAttribute('count')).toBe('5'); // reflect: true, via @attribute()'s own wiring

		el.setAttribute('count', '9');
		expect(el.count()).toBe(9);

		el.count.set(2);
		await flush();
		expect(el.getAttribute('count')).toBe('2');
		el.remove();
	});

	it('@state() closer to the field (runs first) - @attribute() still registers and syncs through it', async () => {
		@tag('stack-attr-over-state-plain')
		class Foo extends UIElement {
			@attribute({ type: Number, reflect: true })
			@state()
			count = 3;
		}

		const el = document.createElement('stack-attr-over-state-plain') as Foo;
		document.body.appendChild(el);
		expect(el.count()).toBe(3);
		expect(el.getAttribute('count')).toBe('3'); // @attribute() still registered reflect + the def

		el.setAttribute('count', '7');
		expect(el.count()).toBe(7); // attributeChangedCallback writes through @state()'s store-backed accessor

		el.count.set(4);
		await flush();
		expect(el.getAttribute('count')).toBe('4');
		el.remove();
	});

	it('registers exactly one AttributeDef (no duplicate) regardless of stacking order', () => {
		@tag('stack-single-def')
		class Foo extends UIElement {
			@state()
			@attribute({ reflect: true })
			label = 'hi';
		}

		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes).toEqual(['label']);
	});
});
