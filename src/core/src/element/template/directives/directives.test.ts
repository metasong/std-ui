import { describe, expect, it } from 'vitest';
import { t } from '../tag-funcs/html/index.js';
import { render } from '../render.js';
import { classMap } from './class-map/index.js';
import { styleMap } from './style-map/index.js';

describe('classMap end-to-end', () => {
	it('toggles classes through t()/render()', () => {
		const container = document.createElement('div');
		const view = (active: boolean) => t`<div class="${classMap({ active, base: true })}"></div>`;

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
	it('sets/removes inline styles through t()/render()', () => {
		const container = document.createElement('div');
		const view = (big: boolean) => t`<div style="${styleMap({ color: 'red', fontSize: big ? '20px' : null })}"></div>`;

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
