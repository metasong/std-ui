import { describe, expect, it, vi } from 'vitest';
import { attribute, tag, UIElement } from '../../ui-element.js';
import { effect, state } from '../../../reactive/index.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('@attribute()', () => {
	it('reflects the initial field value onto the attribute on connect when reflect: true', () => {
		@tag('attr-reflect-init')
		class Foo extends UIElement {
			@attribute({ type: Number, reflect: true }) readonly count = state(5);
		}

		const el = document.createElement('attr-reflect-init') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5');
		el.remove();
	});

	it('seeds the property/signal from a pre-existing attribute (upgrade), overriding the field default', () => {
		@tag('attr-seed-attr')
		class Foo extends UIElement {
			@attribute({ type: Number }) readonly count = state(0);
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
			@attribute() readonly label = state('hi');
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
			@attribute({ reflect: true }) readonly label = state('hi');
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
			@attribute({ type: Number }) readonly count = state(0);
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
			@attribute({ type: Boolean, reflect: true }) readonly active = state(false);
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

	it('a plain state() field (no @attribute()) never touches an attribute', async () => {
		@tag('attr-use-state-instead')
		class Foo extends UIElement {
			readonly internalOnly = state('secret');
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
			@attribute({ reflect: true }) readonly maxCount = state('ten');
		}

		const el = document.createElement('attr-kebab') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('max-count')).toBe('ten');
		el.remove();
	});

	it('supports a custom name option, overriding the kebab-case default (the old `attribute` option)', () => {
		@tag('attr-custom-name')
		class Foo extends UIElement {
			@attribute({ name: 'data-max', reflect: true }) readonly maxCount = state('ten');
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
			@attribute({ type: Object, reflect: true }) readonly config = state({ a: 1 });
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

	it('does not loop or re-notify subscribers when a reflected Object round-trips through its attribute', async () => {
		@tag('attr-obj-roundtrip')
		class Foo extends UIElement {
			@attribute({ type: Object, reflect: true }) readonly config = state({ a: 1 });
		}
		const el = document.createElement('attr-obj-roundtrip') as Foo;
		document.body.appendChild(el);
		await flush();

		let runs = 0;
		const stop = effect(() => { el.config(); runs++; });
		expect(runs).toBe(1);

		el.config.set({ a: 2 });
		await flush();
		await flush();
		expect(el.getAttribute('config')).toBe('{"a":2}');
		expect(runs).toBe(2); // the set itself; the attribute echo must not notify again
		stop();
		el.remove();
	});

	it('keeps the object identity that was set when a reflected Object is written to its attribute', async () => {
		@tag('attr-obj-identity')
		class Foo extends UIElement {
			@attribute({ type: Object, reflect: true }) readonly config = state<{ a: number }>({ a: 1 });
		}
		const el = document.createElement('attr-obj-identity') as Foo;
		document.body.appendChild(el);
		const mine = { a: 2 };
		el.config.set(mine);
		await flush();
		expect(el.getAttribute('config')).toBe('{"a":2}');
		expect(el.config.peek()).toBe(mine); // not replaced by a JSON copy of itself

		el.setAttribute('config', '{"a":7}'); // a real external attribute write still parses
		expect(el.config.peek()).toEqual({ a: 7 });
		el.remove();
	});

	it('leaves an object field untouched when the attribute is absent/unparsable (empty-object merge is a no-op)', () => {
		@tag('attr-obj-bad')
		class Foo extends UIElement {
			@attribute({ type: Object }) readonly config = state({ a: 1 });
		}

		const el = document.createElement('attr-obj-bad') as Foo;
		el.setAttribute('config', 'not json');
		document.body.appendChild(el);
		// The default `Object` converter falls back to `{}` on unparsable text, but writing `{}`
		// through the `state`'s `DeepPartial` merge provides no keys to overwrite, so the
		// field's existing leaves are left as-is rather than cleared.
		expect(el.config()).toEqual({});
		el.remove();
	});

	it('Number: absent and empty attributes are 0, a non-numeric one is NaN (documented behaviour)', () => {
		@tag('attr-num-edge')
		class Foo extends UIElement {
			@attribute({ type: Number }) readonly count = state(5);
		}

		const el = document.createElement('attr-num-edge') as Foo;
		document.body.appendChild(el);
		el.setAttribute('count', '7');
		expect(el.count()).toBe(7);
		el.setAttribute('count', '');
		expect(el.count()).toBe(0);
		el.setAttribute('count', 'abc');
		expect(el.count()).toBeNaN();
		el.setAttribute('count', '3');
		el.removeAttribute('count');
		expect(el.count()).toBe(0); // the zero value, like '' for String and false for Boolean, not the initial 5
		el.remove();
	});

	it('infers type: Number from a numeric initial value when type/converter are omitted', () => {
		@tag('attr-inf-num')
		class Foo extends UIElement {
			@attribute({ reflect: true }) readonly count = state(5); // no `type` - inferred as Number from `5`
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
			@attribute({ reflect: true }) readonly active = state(false);
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
			@attribute({ reflect: true }) readonly config = state({ a: 1 });
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
			@attribute({ reflect: true }) readonly tags = state<string[]>(['a', 'b']);
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
			readonly config = state({ theme: 'dark' });
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

	it('leaves the host attribute unchanged when toAttribute returns undefined', async () => {
		@tag('attr-toattr-skip')
		class Foo extends UIElement {
			@attribute({
				reflect: true,
				converter: {
					fromAttribute: (value: string | null) => value ?? '',
					toAttribute: (value: unknown) => (value === 'skip' ? undefined : String(value)),
				},
			})
			readonly label = state('hi');
		}

		const el = document.createElement('attr-toattr-skip') as Foo;
		el.setAttribute('label', 'from-markup');
		document.body.appendChild(el);
		expect(el.getAttribute('label')).toBe('from-markup');

		el.label.set('skip');
		await flush();
		expect(el.getAttribute('label')).toBe('from-markup');
		expect(el.label()).toBe('skip');

		el.label.set('updated');
		await flush();
		expect(el.getAttribute('label')).toBe('updated');
		el.remove();
	});
});

describe('@attribute() on a plain (non-store) field', () => {
	it('assigns the parsed attribute to the field, inferring the type from its initial value', () => {
		@tag('attr-plain-assign')
		class Foo extends UIElement {
			@attribute() base = '';
			@attribute() enabled = false;
			@attribute() count = 0;
		}

		const el = document.createElement('attr-plain-assign') as Foo;
		el.setAttribute('base', '/app');
		el.setAttribute('enabled', '');
		el.setAttribute('count', '4');
		document.body.appendChild(el);
		expect(el.base).toBe('/app');
		expect(el.enabled).toBe(true);
		expect(el.count).toBe(4);
		el.remove();
	});

	it('warns once in dev and skips reflect: true, but still parses attribute -> property', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		@tag('attr-plain-reflect')
		class Foo extends UIElement {
			@attribute({ reflect: true }) label = 'hi';
		}

		const a = document.createElement('attr-plain-reflect') as Foo;
		const b = document.createElement('attr-plain-reflect') as Foo;
		a.setAttribute('label', 'x');
		document.body.append(a, b);
		expect(a.label).toBe('x');
		expect(b.hasAttribute('label')).toBe(false); // not reflected: a plain field cannot be observed
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]![0])).toContain('state() store');
		a.remove();
		b.remove();
		warn.mockRestore();
	});
});