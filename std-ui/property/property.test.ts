import { describe, expect, it } from 'vitest';
import { element, property, UIElement } from '../component.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('@property()', () => {
	it('reflects the initial field value onto the attribute on connect when reflect: true', () => {
		@element('prop-reflect-init')
		class Foo extends UIElement {
			@property({ type: Number, reflect: true }) count = 5;
		}

		const el = document.createElement('prop-reflect-init') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5');
		el.remove();
	});

	it('seeds the property/signal from a pre-existing attribute (upgrade), overriding the field default', () => {
		@element('prop-seed-attr')
		class Foo extends UIElement {
			@property({ type: Number }) count = 0;
		}

		const el = document.createElement('prop-seed-attr') as Foo;
		el.setAttribute('count', '42');
		document.body.appendChild(el);
		expect(el.count).toBe(42);
		el.remove();
	});

	it('does not reflect the property onto the attribute by default', async () => {
		@element('prop-no-reflect')
		class Foo extends UIElement {
			@property() label = 'hi';
		}

		const el = document.createElement('prop-no-reflect') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('label')).toBe(false);

		el.label = 'bye';
		await flush();
		expect(el.hasAttribute('label')).toBe(false);
		expect(el.label).toBe('bye');
		el.remove();
	});

	it('updates the attribute when the property is set from JS, with reflect: true', async () => {
		@element('prop-reflect-js')
		class Foo extends UIElement {
			@property({ reflect: true }) label = 'hi';
		}

		const el = document.createElement('prop-reflect-js') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('label')).toBe('hi');

		el.label = 'bye';
		await flush();
		expect(el.getAttribute('label')).toBe('bye');
		el.remove();
	});

	it('updates the property when the attribute is set/changed on the tag (native attributeChangedCallback)', async () => {
		@element('prop-attr-change')
		class Foo extends UIElement {
			@property({ type: Number }) count = 0;
		}

		const el = document.createElement('prop-attr-change') as Foo;
		document.body.appendChild(el);

		el.setAttribute('count', '9');
		expect(el.count).toBe(9);
		el.remove();
	});

	it('supports boolean attributes: presence-based, removed when false', async () => {
		@element('prop-boolean')
		class Foo extends UIElement {
			@property({ type: Boolean, reflect: true }) active = false;
		}

		const el = document.createElement('prop-boolean') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('active')).toBe(false);

		el.active = true;
		await flush();
		expect(el.hasAttribute('active')).toBe(true);
		expect(el.getAttribute('active')).toBe('');

		el.removeAttribute('active');
		expect(el.active).toBe(false);
		el.remove();
	});

	it('supports attribute: false to opt a property out of attribute reflection entirely', async () => {
		@element('prop-no-attr')
		class Foo extends UIElement {
			@property({ attribute: false }) internalOnly = 'secret';
		}

		const el = document.createElement('prop-no-attr') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('internal-only')).toBe(false);

		el.internalOnly = 'still-secret';
		await flush();
		expect(el.hasAttribute('internal-only')).toBe(false);
		expect(el.internalOnly).toBe('still-secret');
		el.remove();
	});

	it('defaults the attribute name to kebab-case of the field name', () => {
		@element('prop-kebab')
		class Foo extends UIElement {
			@property({ reflect: true }) maxCount = 'ten';
		}

		const el = document.createElement('prop-kebab') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('max-count')).toBe('ten');
		el.remove();
	});

	it('is readable/writable inside template(), re-rendering when the property changes', async () => {
		const rendered: string[] = [];

		@element('prop-template')
		class Foo extends UIElement {
			@property() label = 'a';
			protected override template(): void {
				rendered.push(this.label);
			}
		}

		const el = document.createElement('prop-template') as Foo;
		document.body.appendChild(el);
		expect(rendered).toEqual(['a']);

		el.label = 'b';
		await flush();
		expect(rendered).toEqual(['a', 'b']);
		el.remove();
	});

	it('backs a complex-object field with a SignalTree, reading/writing the whole object', async () => {
		@element('prop-obj-tree')
		class Foo extends UIElement {
			@property({ attribute: false }) config = { a: 1, b: { c: 2 } };
		}

		const el = document.createElement('prop-obj-tree') as Foo;
		document.body.appendChild(el);
		expect(el.config).toEqual({ a: 1, b: { c: 2 } });

		el.config = { ...el.config, a: 2 };
		await flush();
		expect(el.config).toEqual({ a: 2, b: { c: 2 } });
		el.remove();
	});

	it('leaves an unrelated nested branch untouched (same object identity) when only a sibling leaf changes', async () => {
		@element('prop-obj-sibling')
		class Foo extends UIElement {
			@property({ attribute: false }) config = { a: 1, b: { c: 2 } };
		}

		const el = document.createElement('prop-obj-sibling') as Foo;
		document.body.appendChild(el);
		const bBefore = el.config.b;

		el.config = { ...el.config, a: 2 }; // only `a` changes; `b`'s leaf (`c`) is unchanged
		await flush();
		expect(el.config.b).toBe(bBefore); // `b`'s branch never recomputed, so its identity is preserved
		el.remove();
	});

	it('supports type: Object to reflect a complex-object field to/from the attribute as JSON', async () => {
		@element('prop-obj-json')
		class Foo extends UIElement {
			@property({ type: Object, reflect: true }) config = { a: 1 };
		}

		const el = document.createElement('prop-obj-json') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('config')).toBe('{"a":1}');

		el.setAttribute('config', '{"a":9}');
		expect(el.config).toEqual({ a: 9 });

		el.config = { a: 3 };
		await flush();
		expect(el.getAttribute('config')).toBe('{"a":3}');
		el.remove();
	});

	it('leaves an object field untouched when the attribute is absent/unparsable (empty-object merge is a no-op)', () => {
		@element('prop-obj-bad')
		class Foo extends UIElement {
			@property({ type: Object }) config = { a: 1 };
		}

		const el = document.createElement('prop-obj-bad') as Foo;
		el.setAttribute('config', 'not json');
		document.body.appendChild(el);
		// The default `Object` converter falls back to `{}` on unparsable text, but writing `{}`
		// through the `SignalTree`'s `DeepPartial` merge provides no keys to overwrite, so the
		// field's existing leaves are left as-is rather than cleared.
		expect(el.config).toEqual({ a: 1 });
		el.remove();
	});

	it('infers type: Number from a numeric initial value when type/converter are omitted', () => {
		@element('prop-inf-num')
		class Foo extends UIElement {
			@property({ reflect: true }) count = 5; // no `type` - inferred as Number from `5`
		}

		const el = document.createElement('prop-inf-num') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('count')).toBe('5'); // reflected as Number's converter would

		el.setAttribute('count', '42');
		expect(el.count).toBe(42); // parsed as a number, not left as the string "42"
		el.remove();
	});

	it('infers type: Boolean from a boolean initial value when type/converter are omitted', async () => {
		@element('prop-inf-bool')
		class Foo extends UIElement {
			@property({ reflect: true }) active = false;
		}

		const el = document.createElement('prop-inf-bool') as Foo;
		document.body.appendChild(el);
		expect(el.hasAttribute('active')).toBe(false); // Boolean converter, not String's `''`

		el.active = true;
		await flush();
		expect(el.getAttribute('active')).toBe(''); // presence-based, like type: Boolean
		el.remove();
	});

	it('infers type: Object from a plain-object initial value when type/converter are omitted', () => {
		@element('prop-inf-obj')
		class Foo extends UIElement {
			@property({ reflect: true }) config = { a: 1 };
		}

		const el = document.createElement('prop-inf-obj') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('config')).toBe('{"a":1}'); // JSON, like type: Object

		el.setAttribute('config', '{"a":9}');
		expect(el.config).toEqual({ a: 9 });
		el.remove();
	});

	it('infers type: Array from an array initial value when type/converter are omitted', () => {
		@element('prop-inf-arr')
		class Foo extends UIElement {
			@property({ attribute: false }) tags: string[] = ['a', 'b'];
		}

		const el = document.createElement('prop-inf-arr') as Foo;
		document.body.appendChild(el);
		expect(el.tags).toEqual(['a', 'b']);
		el.remove();
	});

	it('supports a fully custom converter, overriding the type-based default', async () => {
		@element('prop-converter')
		class Foo extends UIElement {
			@property({
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

		const el = document.createElement('prop-converter') as Foo;
		document.body.appendChild(el);
		expect(el.getAttribute('config')).toBe('{"theme":"dark"}');

		el.setAttribute('config', 'garbage');
		expect(el.config).toEqual({ theme: 'dark' }); // custom converter's fallback, not the type default's {}

		el.config = { theme: 'light' };
		await flush();
		expect(el.getAttribute('config')).toBe('{"theme":"light"}');
		el.remove();
	});
});
