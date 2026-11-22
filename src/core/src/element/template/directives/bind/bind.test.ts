import { describe, expect, it, vi } from 'vitest';
import { t } from '../../tag-funcs/html/index.js';
import { render } from '../../render.js';
import { stateTree } from '../../../../reactive/index.js';
import { attribute, tag, UIElement } from '../../../ui-element.js';
import { bind } from './index.js';

describe('bind()', () => {
	it('binds a state node directly, keeping numeric models numeric', () => {
		const container = document.createElement('div');
		const form = stateTree({ query: 'hi', age: 3 });
		const view = () =>
			t`<input .value=${bind(form.query)} /><input type="number" .value=${bind(form.age)} />`;
		render(view(), container);
		const [a, b] = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
		expect(a.value).toBe('hi');
		a.value = 'yo';
		a.dispatchEvent(new Event('input', { bubbles: true }));
		expect(form.query()).toBe('yo');
		b.value = '7';
		b.dispatchEvent(new Event('input', { bubbles: true }));
		expect(form.age()).toBe(7);
		form.query.set('reset');
		render(view(), container);
		expect(a.value).toBe('reset');
	});

	it('syncs .value both ways with live skip on redundant render', () => {
		const container = document.createElement('div');
		const store = stateTree({ query: 'hi' });
		const view = () => t`<input .value=${bind(store.query)} />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.value).toBe('hi');

		const setter = vi.spyOn(input, 'value', 'set');
		render(view(), container);
		expect(setter).not.toHaveBeenCalled();

		input.value = 'hello';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(store.query()).toBe('hello');

		store.query.set('reset');
		render(view(), container);
		expect(input.value).toBe('reset');
	});

	it('syncs .checked via change', () => {
		const container = document.createElement('div');
		const store = stateTree({ on: false });
		const view = () => t`<input type="checkbox" .checked=${bind(store.on)} />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.checked).toBe(false);

		input.checked = true;
		input.dispatchEvent(new Event('change', { bubbles: true }));
		expect(store.on()).toBe(true);

		store.on.set(false);
		render(view(), container);
		expect(input.checked).toBe(false);
	});

	it('binds arbitrary properties with default `${property}-change` event', () => {
		const container = document.createElement('div');
		const store = stateTree({ level: 1 });
		const view = () => t`<div .level=${bind(store.level)}></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { level: number };
		expect(div.level).toBe(1);

		div.level = 5;
		div.dispatchEvent(new Event('level-change', { bubbles: true }));
		expect(store.level()).toBe(5);

		store.level.set(2);
		render(view(), container);
		expect(div.level).toBe(2);
	});

	it('throws when .checked is bound to a non-checkable <input>', () => {
		const container = document.createElement('div');
		const store = stateTree({ on: false });
		expect(() =>
			render(t`<input type="text" .checked=${bind(store.on)} />`, container),
		).toThrow(/type="checkbox"/i);
	});

	it('uses checked-change on non-input elements', () => {
		const container = document.createElement('div');
		const store = stateTree({ on: false });
		const view = () => t`<div .checked=${bind(store.on)}></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { checked: boolean };
		expect(div.checked).toBe(false);

		div.checked = true;
		div.dispatchEvent(new Event('checked-change', { bubbles: true }));
		expect(store.on()).toBe(true);
	});

	it('uses property name for default event (`.document` → `document-change`)', () => {
		const container = document.createElement('div');
		const store = stateTree({ payload: { title: 'a' } });
		const view = () => t`<div .document=${bind(store.payload)}></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { document: unknown };
		expect(div.document).toEqual({ title: 'a' });

		div.document = { title: 'b' };
		div.dispatchEvent(new Event('document-change', { bubbles: true }));
		expect(store.payload.deep()).toEqual({ title: 'b' });
	});

	it('supports { get, set } accessors', () => {
		const container = document.createElement('div');
		let value = 'x';
		render(t`<input .value="${bind({ get: () => value, set: v => (value = v as string) })}" />`, container);
		const input = container.querySelector('input')! as HTMLInputElement;
		input.value = 'y';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(value).toBe('y');
	});

	it('uses the latest accessor on re-render (no stale closures)', () => {
		const container = document.createElement('div');
		const a = stateTree({ v: 'a' });
		const b = stateTree({ v: 'b' });
		const view = (s: typeof a) => t`<input .value=${bind(s.v)} />`;
		render(view(a), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		render(view(b), container);
		expect(input.value).toBe('b');
		input.value = 'typed';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(b.v()).toBe('typed');
		expect(a.v()).toBe('a');
	});

	it('kebab-cases camelCase properties for the default event', () => {
		const container = document.createElement('div');
		const store = stateTree({ minValue: 1 });
		render(t`<div .minValue=${bind(store.minValue)}></div>`, container);
		const div = container.querySelector('div')! as HTMLDivElement & { minValue: number };
		div.minValue = 9;
		div.dispatchEvent(new Event('min-value-change', { bubbles: true }));
		expect(store.minValue()).toBe(9);
	});

	it('re-syncs sibling radios in the same group', () => {
		const container = document.createElement('div');
		const store = stateTree({ a: true, b: false });
		const view = () =>
			t`<input type="radio" name="g" .checked=${bind(store.a)} /><input type="radio" name="g" .checked=${bind(store.b)} />`;
		render(view(), container);
		const [ra, rb] = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
		rb.checked = true;
		rb.dispatchEvent(new Event('change', { bubbles: true }));
		expect(store.b()).toBe(true);
		expect(store.a()).toBe(false);
		expect(ra.checked).toBe(false);
	});

	it('stops listening after the template is torn down', () => {
		const container = document.createElement('div');
		const store = stateTree({ query: 'x' });
		render(t`<input .value=${bind(store.query)} />`, container);
		const input = container.querySelector('input')! as HTMLInputElement;
		render(t`<p>gone</p>`, container);
		input.value = 'late';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(store.query()).toBe('x');
	});

	it('binds state and @attribute() fields directly', () => {
		@tag('bind-decorated-fields')
		class Host extends UIElement {
			readonly text = stateTree('hi');
			@attribute() readonly age = stateTree(3);
		}
		const host = document.createElement('bind-decorated-fields') as Host;
		const container = document.createElement('div');
		const view = () =>
			t`<input .value=${bind(host.text)} /><input type="number" .value=${bind(host.age)} />`;
		render(view(), container);
		const [a, b] = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
		expect(a.value).toBe('hi');
		a.value = 'yo';
		a.dispatchEvent(new Event('input', { bubbles: true }));
		expect(host.text()).toBe('yo');
		b.value = '7';
		b.dispatchEvent(new Event('input', { bubbles: true }));
		expect(host.age()).toBe(7);
		host.text.set('reset');
		render(view(), container);
		expect(a.value).toBe('reset');
	});

	it('rejects values that are neither a signal nor an accessor', () => {
		expect(() => bind({} as never)).toThrow(/signal/);
	});
});
