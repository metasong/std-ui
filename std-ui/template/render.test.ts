import { describe, expect, it } from 'vitest';
import { html, svg } from './html.js';
import { render } from './render.js';

describe('render', () => {
	it('builds DOM from an html() result into the container', () => {
		const container = document.createElement('div');
		render(html`<p>Hello, ${'Ada'}!</p>`, container);
		expect(container.querySelector('p')!.textContent).toBe('Hello, Ada!');
	});

	it('clears any pre-existing content in the container on first render', () => {
		const container = document.createElement('div');
		container.textContent = 'old content';
		render(html`<p>new</p>`, container);
		expect(container.textContent).toBe('new');
	});

	it('reuses the same DOM across repeated renders from the same call site, patching only values', () => {
		const container = document.createElement('div');
		const view = (name: string) => html`<p class="${name}">${name}</p>`;
		render(view('Ada'), container);
		const p = container.querySelector('p');

		render(view('Grace'), container);
		expect(container.querySelector('p')).toBe(p); // same element, reused
		expect(p!.textContent).toBe('Grace');
		expect(p!.getAttribute('class')).toBe('Grace');
	});

	it('tears down and rebuilds fresh when switching to a different template literal', () => {
		const container = document.createElement('div');
		render(html`<p>${'x'}</p>`, container);
		const p = container.querySelector('p');

		render(html`<div>${'x'}</div>`, container);
		expect(container.querySelector('p')).toBeNull();
		expect(container.querySelector('div')).not.toBeNull();
		expect(p).not.toBe(container.firstElementChild);
	});

	it('supports rendering svg() results, with elements in the SVG namespace', () => {
		const container = document.createElement('div');
		render(svg`<circle r="${3}" />`, container);
		const circle = container.querySelector('circle')!;
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('tracks renders per-container independently', () => {
		const containerA = document.createElement('div');
		const containerB = document.createElement('div');
		const view = (name: string) => html`<p>${name}</p>`;
		render(view('A'), containerA);
		render(view('B'), containerB);
		expect(containerA.textContent).toBe('A');
		expect(containerB.textContent).toBe('B');
	});
});
