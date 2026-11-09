import { describe, expect, it, vi } from 'vitest';
import { t } from '../../html.js';
import { render } from '../../render.js';
import { signalState } from '../../../signal/index.js';
import { bind } from './index.js';

describe('bind()', () => {
	it('binds a signalState node directly, keeping numeric models numeric', () => {
		const container = document.createElement('div');
		const form = signalState({ query: 'hi', age: 3 });
		const view = () =>
			t`<input .value="${bind(form.query)}" /><input type="number" .value="${bind(form.age)}" />`;
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
		const state = signalState({ query: 'hi' });
		const view = () => t`<input .value="${bind(state.query)}" />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.value).toBe('hi');

		const setter = vi.spyOn(input, 'value', 'set');
		render(view(), container);
		expect(setter).not.toHaveBeenCalled();

		input.value = 'hello';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(state.query()).toBe('hello');

		state.query.set('reset');
		render(view(), container);
		expect(input.value).toBe('reset');
	});

	it('syncs .checked via change', () => {
		const container = document.createElement('div');
		const state = signalState({ on: false });
		const view = () => t`<input type="checkbox" .checked="${bind(state.on)}" />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.checked).toBe(false);

		input.checked = true;
		input.dispatchEvent(new Event('change', { bubbles: true }));
		expect(state.on()).toBe(true);

		state.on.set(false);
		render(view(), container);
		expect(input.checked).toBe(false);
	});

	it('binds arbitrary properties with default `${property}-change` event', () => {
		const container = document.createElement('div');
		const state = signalState({ level: 1 });
		const view = () => t`<div .level="${bind(state.level)}"></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { level: number };
		expect(div.level).toBe(1);

		div.level = 5;
		div.dispatchEvent(new Event('level-change', { bubbles: true }));
		expect(state.level()).toBe(5);

		state.level.set(2);
		render(view(), container);
		expect(div.level).toBe(2);
	});

	it('throws when .checked is bound to a non-checkable <input>', () => {
		const container = document.createElement('div');
		const state = signalState({ on: false });
		expect(() =>
			render(t`<input type="text" .checked="${bind(state.on)}" />`, container),
		).toThrow(/type="checkbox"/i);
	});

	it('uses checked-change on non-input elements', () => {
		const container = document.createElement('div');
		const state = signalState({ on: false });
		const view = () => t`<div .checked="${bind(state.on)}"></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { checked: boolean };
		expect(div.checked).toBe(false);

		div.checked = true;
		div.dispatchEvent(new Event('checked-change', { bubbles: true }));
		expect(state.on()).toBe(true);
	});

	it('uses property name for default event (`.document` → `document-change`)', () => {
		const container = document.createElement('div');
		const state = signalState({ payload: { title: 'a' } });
		const view = () => t`<div .document="${bind(state.payload)}"></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { document: unknown };
		expect(div.document).toEqual({ title: 'a' });

		div.document = { title: 'b' };
		div.dispatchEvent(new Event('document-change', { bubbles: true }));
		expect(state.payload()).toEqual({ title: 'b' });
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
		const a = signalState({ v: 'a' });
		const b = signalState({ v: 'b' });
		const view = (s: typeof a) => t`<input .value="${bind(s.v)}" />`;
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
		const state = signalState({ minValue: 1 });
		render(t`<div .minValue="${bind(state.minValue)}"></div>`, container);
		const div = container.querySelector('div')! as HTMLDivElement & { minValue: number };
		div.minValue = 9;
		div.dispatchEvent(new Event('min-value-change', { bubbles: true }));
		expect(state.minValue()).toBe(9);
	});

	it('re-syncs sibling radios in the same group', () => {
		const container = document.createElement('div');
		const state = signalState({ a: true, b: false });
		const view = () =>
			t`<input type="radio" name="g" .checked="${bind(state.a)}" /><input type="radio" name="g" .checked="${bind(state.b)}" />`;
		render(view(), container);
		const [ra, rb] = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
		rb.checked = true;
		rb.dispatchEvent(new Event('change', { bubbles: true }));
		expect(state.b()).toBe(true);
		expect(state.a()).toBe(false);
		expect(ra.checked).toBe(false);
	});

	it('stops listening after the template is torn down', () => {
		const container = document.createElement('div');
		const state = signalState({ query: 'x' });
		render(t`<input .value="${bind(state.query)}" />`, container);
		const input = container.querySelector('input')! as HTMLInputElement;
		render(t`<p>gone</p>`, container);
		input.value = 'late';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(state.query()).toBe('x');
	});

	it('rejects values that are neither a signal nor an accessor', () => {
		expect(() => bind({} as never)).toThrow(/signal/);
	});
});
