import { describe, expect, it } from 'vitest';
import { html } from '../template/html.js';
import { render } from '../template/render.js';
import { classMap } from './class-map.js';
import { styleMap } from './style-map.js';

describe('classMap end-to-end', () => {
	it('toggles classes through html()/render()', () => {
		const container = document.createElement('div');
		const view = (active: boolean) => html`<div class="${classMap({ active, base: true })}"></div>`;

		render(view(true), container);
		const div = container.querySelector('div')!;
		expect(div.classList.contains('active')).toBe(true);
		expect(div.classList.contains('base')).toBe(true);

		render(view(false), container);
		expect(container.querySelector('div')).toBe(div); // same element, reused
		expect(div.classList.contains('active')).toBe(false);
		expect(div.classList.contains('base')).toBe(true);
	});
});

describe('styleMap end-to-end', () => {
	it('sets/removes inline styles through html()/render()', () => {
		const container = document.createElement('div');
		const view = (big: boolean) => html`<div style="${styleMap({ color: 'red', fontSize: big ? '20px' : null })}"></div>`;

		render(view(true), container);
		const div = container.querySelector('div')!;
		expect(div.style.color).toBe('red');
		expect(div.style.fontSize).toBe('20px');

		render(view(false), container);
		expect(container.querySelector('div')).toBe(div);
		expect(div.style.color).toBe('red');
		expect(div.style.fontSize).toBe('');
	});
});
