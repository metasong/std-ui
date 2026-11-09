import { describe, expect, it } from 'vitest';
import { attribute, state, tag, UIElement } from '../../ui-element.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('@attribute()', () => {
	it('reflects the initial field value onto the attribute on connect when reflect: true', () => {
		@tag('attr-reflect-init')
		class Foo extends UIElement {
			@attribute({ type: Number, reflect: true }) count = 5;
		}

		const el = document.createElement('attr-reflect-init') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5');
		el.remove();
	});

	it('seeds the property/signal from a pre-existing attribute (upgrade), overriding the field default', () => {
		@tag('attr-seed-attr')
		class Foo extends UIElement {
			@attribute({ type: Number }) count = 0;
		}

		const el = document.createElement('attr-seed-attr') as Foo;
		el.setAttribute('count', '42');
		document.body.appendChild(el);
		expect(el.count()).toBe(42);
		el.remove();
	});

	it('does not reflect the property onto the attribute by default', async () => {
		@tag('attr-no-reflect')
		class Foo extends UIElement {
			@attribute() label = 'hi';
		}

		const el = document.createElement('attr-no-reflect') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('label')).toBe(false);

		el.label.set('bye');
		await flush();
		expect(el.hasAttribute('label')).toBe(false);
		expect(el.label()).toBe('bye');
		el.remove();
	});

	it('updates the attribute when the property is set from JS, with reflect: true', async () => {
		@tag('attr-reflect-js')
		class Foo extends UIElement {
			@attribute({ reflect: true }) label = 'hi';
		}

		const el = document.createElement('attr-reflect-js') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('label')).toBe('hi');

		el.label.set('bye');
		await flush();
		expect(el.getAttribute('label')).toBe('bye');
		el.remove();
	});

	it('updates the property when the attribute is set/changed on the tag (native attributeChangedCallback)', async () => {
		@tag('attr-attr-change')
		class Foo extends UIElement {
			@attribute({ type: Number }) count = 0;
		}

		const el = document.createElement('attr-attr-change') as Foo;
		document.body.appendChild(el);

		el.setAttribute('count', '9');
		expect(el.count()).toBe(9);
		el.remove();
	});

	it('supports boolean attributes: presence-based, removed when false', async () => {
		@tag('attr-boolean')
		class Foo extends UIElement {
			@attribute({ type: Boolean, reflect: true }) active = false;
		}

		const el = document.createElement('attr-boolean') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('active')).toBe(false);

		el.active.set(true);
		await flush();
		expect(el.hasAttribute('active')).toBe(true);
		expect(el.getAttribute('active')).toBe('');

		el.removeAttribute('active');
		expect(el.active()).toBe(false);
		el.remove();
	});

	it('uses @state() (not @attribute()) to opt a property out of attribute reflection entirely', async () => {
		@tag('attr-use-state-instead')
		class Foo extends UIElement {
			@state() internalOnly = 'secret';
		}

		const el = document.createElement('attr-use-state-instead') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('internal-only')).toBe(false);
		expect((Foo as unknown as { observedAttributes?: string[] }).observedAttributes ?? []).not.toContain('internal-only');

		el.internalOnly.set('still-secret');
		await flush();
		expect(el.hasAttribute('internal-only')).toBe(false);
		expect(el.internalOnly()).toBe('still-secret');
		el.remove();
	});

	it('defaults the attribute name to kebab-case of the field name', () => {
		@tag('attr-kebab')
		class Foo extends UIElement {
			@attribute({ reflect: true }) maxCount = 'ten';
		}

		const el = document.createElement('attr-kebab') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('max-count')).toBe('ten');
		el.remove();
	});

	it('supports a custom name option, overriding the kebab-case default (the old `attribute` option)', () => {
		@tag('attr-custom-name')
		class Foo extends UIElement {
			@attribute({ name: 'data-max', reflect: true }) maxCount = 'ten';
		}

		const el = document.createElement('attr-custom-name') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('data-max')).toBe('ten');
		expect(el.hasAttribute('max-count')).toBe(false);
		el.remove();
	});

	it('supports type: Object to reflect a complex-object field to/from the attribute as JSON', async () => {
		@tag('attr-obj-json')
		class Foo extends UIElement {
			@attribute({ type: Object, reflect: true }) config = { a: 1 };
		}

		const el = document.createElement('attr-obj-json') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('config')).toBe('{"a":1}');

		el.setAttribute('config', '{"a":9}');
		expect(el.config()).toEqual({ a: 9 });

		el.config.set({ a: 3 });
		await flush();
		expect(el.getAttribute('config')).toBe('{"a":3}');
		el.remove();
	});

	it('leaves an object field untouched when the attribute is absent/unparsable (empty-object merge is a no-op)', () => {
		@tag('attr-obj-bad')
		class Foo extends UIElement {
			@attribute({ type: Object }) config = { a: 1 };
		}

		const el = document.createElement('attr-obj-bad') as Foo;
		el.setAttribute('config', 'not json');
		document.body.appendChild(el);
		// The default `Object` converter falls back to `{}` on unparsable text, but writing `{}`
		// through the `SignalState`'s `DeepPartial` merge provides no keys to overwrite, so the
		// field's existing leaves are left as-is rather than cleared.
		expect(el.config()).toEqual({ a: 1 });
		el.remove();
	});

	it('infers type: Number from a numeric initial value when type/converter are omitted', () => {
		@tag('attr-inf-num')
		class Foo extends UIElement {
			@attribute({ reflect: true }) count = 5; // no `type` - inferred as Number from `5`
		}

		const el = document.createElement('attr-inf-num') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5'); // reflected as Number's converter would

		el.setAttribute('count', '42');
		expect(el.count()).toBe(42); // parsed as a number, not left as the string "42"
		el.remove();
	});

	it('infers type: Boolean from a boolean initial value when type/converter are omitted', async () => {
		@tag('attr-inf-bool')
		class Foo extends UIElement {
			@attribute({ reflect: true }) active = false;
		}

		const el = document.createElement('attr-inf-bool') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('active')).toBe(false); // Boolean converter, not String's `''`

		el.active.set(true);
		await flush();
		expect(el.getAttribute('active')).toBe(''); // presence-based, like type: Boolean
		el.remove();
	});

	it('infers type: Object from a plain-object initial value when type/converter are omitted', () => {
		@tag('attr-inf-obj')
		class Foo extends UIElement {
			@attribute({ reflect: true }) config = { a: 1 };
		}

		const el = document.createElement('attr-inf-obj') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('config')).toBe('{"a":1}'); // JSON, like type: Object

		el.setAttribute('config', '{"a":9}');
		expect(el.config()).toEqual({ a: 9 });
		el.remove();
	});

	it('infers type: Array from an array initial value when type/converter are omitted', () => {
		@tag('attr-inf-arr')
		class Foo extends UIElement {
			@attribute({ reflect: true }) tags: string[] = ['a', 'b'];
		}

		const el = document.createElement('attr-inf-arr') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('tags')).toBe('["a","b"]'); // JSON, like type: Array
		el.remove();
	});

	it('supports a fully custom converter, overriding the type-based default', async () => {
		@tag('attr-converter')
		class Foo extends UIElement {
			@attribute({
				type: Object,
				reflect: true,
				converter: {
					fromAttribute: (value: string | null) => {
						try { return value ? JSON.parse(value) : { theme: 'dark' }; } catch { return { theme: 'dark' }; }
					},
					toAttribute: (value: unknown) => (value ? JSON.stringify(value) : ''),
				},
			})
			config = { theme: 'dark' };
		}

		const el = document.createElement('attr-converter') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('config')).toBe('{"theme":"dark"}');

		el.setAttribute('config', 'garbage');
		expect(el.config()).toEqual({ theme: 'dark' }); // custom converter's fallback, not the type default's {}

		el.config.set({ theme: 'light' });
		await flush();
		expect(el.getAttribute('config')).toBe('{"theme":"light"}');
		el.remove();
	});
});
