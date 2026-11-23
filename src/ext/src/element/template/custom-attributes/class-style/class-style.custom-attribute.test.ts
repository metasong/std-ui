import { describe, expect, it } from 'vitest';
import { render, t } from '@std-ui/core';
import '../register.js';

function mount(result: ReturnType<typeof t>): HTMLElement {
	const container = document.createElement('div');
	render(result, container);
	return container.firstElementChild as HTMLElement;
}

describe('class.name / style.prop bindings', () => {
	it('toggles one class and sets/removes one style property', () => {
		const el = mount(t`<div class="base" class.active=${true} style.--gap=${'4px'} style.color="${'red'}"></div>`);
		expect(el.classList.contains('base')).toBe(true);
		expect(el.classList.contains('active')).toBe(true);
		expect(el.style.color).toBe('red');
		expect(el.style.getPropertyValue('--gap')).toBe('4px');
	});

	it('updates when the value changes and leaves other entries alone', () => {
		const container = document.createElement('div');
		const view = (on: boolean, color: string | null) =>
			t`<div class="base" class.active=${on} style.color=${color} style="display: block"></div>`;
		render(view(true, 'red'), container);
		const el = container.firstElementChild as HTMLElement;
		expect(el.classList.contains('active')).toBe(true);

		render(view(false, null), container);
		expect(el.classList.contains('active')).toBe(false);
		expect(el.classList.contains('base')).toBe(true);
		expect(el.style.color).toBe('');
		expect(el.style.display).toBe('block');
	});

	it('honours a trailing !important instead of silently dropping the value', () => {
		const el = mount(t`<div style.color=${'red !important'} style.--x=${'1px!IMPORTANT'}></div>`);
		expect(el.style.getPropertyValue('color')).toBe('red');
		expect(el.style.getPropertyPriority('color')).toBe('important');
		expect(el.style.getPropertyValue('--x')).toBe('1px');
		expect(el.style.getPropertyPriority('--x')).toBe('important');
	});

	it('requires exactly one modifier as the entry', () => {
		expect(() => mount(t`<div class.a.b=${1}></div>`)).toThrow(/exactly one entry/);
		expect(() => mount(t`<div style.color:red=${1}></div>`)).toThrow(/exactly one entry/);
	});

	it('requires a single interpolation with no static text', () => {
		expect(() => mount(t`<div class.active="x${1}"></div>`)).toThrow(/exactly one interpolation/);
	});

	it('leaves a whole-attribute `class=${x}` as a plain attribute', () => {
		const el = mount(t`<div class=${'a b'}></div>`);
		expect(el.getAttribute('class')).toBe('a b');
	});
});
