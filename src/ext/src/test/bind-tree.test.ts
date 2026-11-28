import { describe, expect, it, vi } from 'vitest';
import { t, render, attribute, tag, UIElement, bind } from '@std-ui/core';
import { store } from '../reactive/store/index.js';

describe('bind()', () => {
	it('binds a state node directly, keeping numeric models numeric', () => {
		const container = document.createElement('div');
		const form = store({ query: 'hi', age: 3 });
		const view = () =>
			t`<input .value=${bind(form.query)} /><input type="number" .value=${bind(form.age)} />`;
		render(view(), container);
		const [a, b] = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
		expect(a.value).toBe('hi');
		a.value = 'yo';
		a.dispatchEvent(new Event('input', { bubbles: true }));
		expect(form.query.get()).toBe('yo');
		b.value = '7';
		b.dispatchEvent(new Event('input', { bubbles: true }));
		expect(form.age.get()).toBe(7);
		form.query.set('reset');
		render(view(), container);
		expect(a.value).toBe('reset');
	});

	it('syncs .value both ways with live skip on redundant render', () => {
		const container = document.createElement('div');
		const model = store({ query: 'hi' });
		const view = () => t`<input .value=${bind(model.query)} />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.value).toBe('hi');

		const setter = vi.spyOn(input, 'value', 'set');
		render(view(), container);
		expect(setter).not.toHaveBeenCalled();

		input.value = 'hello';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(model.query.get()).toBe('hello');

		model.query.set('reset');
		render(view(), container);
		expect(input.value).toBe('reset');
	});

	it('syncs .checked via change', () => {
		const container = document.createElement('div');
		const model = store({ on: false });
		const view = () => t`<input type="checkbox" .checked=${bind(model.on)} />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.checked).toBe(false);

		input.checked = true;
		input.dispatchEvent(new Event('change', { bubbles: true }));
		expect(model.on.get()).toBe(true);

		model.on.set(false);
		render(view(), container);
		expect(input.checked).toBe(false);
	});

	it('binds arbitrary properties with default `${property}-change` event', () => {
		const container = document.createElement('div');
		const model = store({ level: 1 });
		const view = () => t`<div .level=${bind(model.level)}></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { level: number };
		expect(div.level).toBe(1);

		div.level = 5;
		div.dispatchEvent(new Event('level-change', { bubbles: true }));
		expect(model.level.get()).toBe(5);

		model.level.set(2);
		render(view(), container);
		expect(div.level).toBe(2);
	});

	it('throws when .checked is bound to a non-checkable <input>', () => {
		const container = document.createElement('div');
		const model = store({ on: false });
		expect(() =>
			render(t`<input type="text" .checked=${bind(model.on)} />`, container),
		).toThrow(/type="checkbox"/i);
	});

	it('uses checked-change on non-input elements', () => {
		const container = document.createElement('div');
		const model = store({ on: false });
		const view = () => t`<div .checked=${bind(model.on)}></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { checked: boolean };
		expect(div.checked).toBe(false);

		div.checked = true;
		div.dispatchEvent(new Event('checked-change', { bubbles: true }));
		expect(model.on.get()).toBe(true);
	});

	it('uses property name for default event (`.document` → `document-change`)', () => {
		const container = document.createElement('div');
		const model = store({ payload: { title: 'a' } });
		const view = () => t`<div .document=${bind(model.payload)}></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { document: unknown };
		expect(div.document).toEqual({ title: 'a' });

		div.document = { title: 'b' };
		div.dispatchEvent(new Event('document-change', { bubbles: true }));
		expect(model.payload.deep()).toEqual({ title: 'b' });
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
		const a = store({ v: 'a' });
		const b = store({ v: 'b' });
		const view = (s: typeof a) => t`<input .value=${bind(s.v)} />`;
		render(view(a), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		render(view(b), container);
		expect(input.value).toBe('b');
		input.value = 'typed';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(b.v.get()).toBe('typed');
		expect(a.v.get()).toBe('a');
	});

	it('kebab-cases camelCase properties for the default event', () => {
		const container = document.createElement('div');
		const model = store({ minValue: 1 });
		render(t`<div .minValue=${bind(model.minValue)}></div>`, container);
		const div = container.querySelector('div')! as HTMLDivElement & { minValue: number };
		div.minValue = 9;
		div.dispatchEvent(new Event('min-value-change', { bubbles: true }));
		expect(model.minValue.get()).toBe(9);
	});

	it('re-syncs sibling radios in the same group', () => {
		const container = document.createElement('div');
		const model = store({ a: true, b: false });
		const view = () =>
			t`<input type="radio" name="g" .checked=${bind(model.a)} /><input type="radio" name="g" .checked=${bind(model.b)} />`;
		render(view(), container);
		const [ra, rb] = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
		rb.checked = true;
		rb.dispatchEvent(new Event('change', { bubbles: true }));
		expect(model.b.get()).toBe(true);
		expect(model.a.get()).toBe(false);
		expect(ra.checked).toBe(false);
	});

	it('stops listening after the template is torn down', () => {
		const container = document.createElement('div');
		const model = store({ query: 'x' });
		render(t`<input .value=${bind(model.query)} />`, container);
		const input = container.querySelector('input')! as HTMLInputElement;
		render(t`<p>gone</p>`, container);
		input.value = 'late';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(model.query.get()).toBe('x');
	});

	it('binds state and @attribute() fields directly', () => {
		@tag('bind-decorated-fields')
		class Host extends UIElement {
			readonly text = store('hi');
			@attribute() readonly age = store(3);
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
		expect(host.text.get()).toBe('yo');
		b.value = '7';
		b.dispatchEvent(new Event('input', { bubbles: true }));
		expect(host.age.get()).toBe(7);
		host.text.set('reset');
		render(view(), container);
		expect(a.value).toBe('reset');
	});

	it('rejects values that are neither a signal nor an accessor', () => {
		expect(() => bind({} as never)).toThrow(/signal/);
	});
});
