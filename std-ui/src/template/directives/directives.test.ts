import { describe, expect, it } from 'vitest';
import { html } from '../html.js';
import { render } from '../render.js';
import { classMap } from './class-map.js';
import { mapByKey } from './map-by-key/index.js';
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

describe('mapByKey end-to-end', () => {
	it('reorders list rows through html()/render() while reusing keyed DOM', () => {
		const container = document.createElement('div');
		type Row = { id: string; label: string };
		const view = (rows: Row[]) =>
			html`<ul>${mapByKey(rows, (r) => r.id, (r) => html`<li data-id="${r.id}">${r.label}</li>`)}</ul>`;

		render(view([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]), container);
		const liA = container.querySelector('li[data-id="a"]')!;
		const liB = container.querySelector('li[data-id="b"]')!;

		render(view([{ id: 'b', label: 'B' }, { id: 'a', label: 'A' }]), container);
		expect(container.querySelector('li[data-id="b"]')).toBe(liB);
		expect(container.querySelector('li[data-id="a"]')).toBe(liA);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.getAttribute('data-id'))).toEqual([
			'b',
			'a',
		]);
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
