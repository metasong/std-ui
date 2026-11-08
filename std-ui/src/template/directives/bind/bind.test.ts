import { describe, expect, it, vi } from 'vitest';
import { html } from '../../html.js';
import { render } from '../../render.js';
import { bind } from './index.js';

describe('bind()', () => {
	it('syncs .value both ways with live skip on redundant render', () => {
		const container = document.createElement('div');
		const state = { query: 'hi' };
		const view = () => html`<input .value="${bind(state, 'query')}" />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.value).toBe('hi');

		const setter = vi.spyOn(input, 'value', 'set');
		render(view(), container);
		expect(setter).not.toHaveBeenCalled();

		input.value = 'hello';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(state.query).toBe('hello');

		state.query = 'reset';
		render(view(), container);
		expect(input.value).toBe('reset');
	});

	it('syncs .checked via change', () => {
		const container = document.createElement('div');
		const state = { on: false };
		const view = () =>
			html`<input type="checkbox" .checked="${bind(state, 'on')}" />`;

		render(view(), container);
		const input = container.querySelector('input')! as HTMLInputElement;
		expect(input.checked).toBe(false);

		input.checked = true;
		input.dispatchEvent(new Event('change', { bubbles: true }));
		expect(state.on).toBe(true);

		state.on = false;
		render(view(), container);
		expect(input.checked).toBe(false);
	});

	it('binds arbitrary properties with default `${property}-change` event', () => {
		const container = document.createElement('div');
		const state = { level: 1 };
		const view = () => html`<div .level="${bind(state, 'level')}"></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { level: number };
		expect(div.level).toBe(1);

		div.level = 5;
		div.dispatchEvent(new Event('level-change', { bubbles: true }));
		expect(state.level).toBe(5);

		state.level = 2;
		render(view(), container);
		expect(div.level).toBe(2);
	});

	it('throws when .checked is bound to a non-checkable <input>', () => {
		const container = document.createElement('div');
		const state = { on: false };
		expect(() =>
			render(
				html`<input type="text" .checked="${bind(state, 'on')}" />`,
				container,
			),
		).toThrow(/type="checkbox"/i);
	});

	it('uses checked-change on non-input elements', () => {
		const container = document.createElement('div');
		const state = { on: false };
		const view = () => html`<div .checked="${bind(state, 'on')}"></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { checked: boolean };
		expect(div.checked).toBe(false);

		div.checked = true;
		div.dispatchEvent(new Event('checked-change', { bubbles: true }));
		expect(state.on).toBe(true);
	});

	it('uses property name for default event (`.document` → `document-change`)', () => {
		const container = document.createElement('div');
		const state = { payload: { title: 'a' } };
		const view = () =>
			html`<div .document="${bind(state, 'payload')}"></div>`;

		render(view(), container);
		const div = container.querySelector('div')! as HTMLDivElement & { document: unknown };
		expect(div.document).toEqual({ title: 'a' });

		div.document = { title: 'b' };
		div.dispatchEvent(new Event('document-change', { bubbles: true }));
		expect(state.payload).toEqual({ title: 'b' });
	});
});
