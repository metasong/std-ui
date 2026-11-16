import { describe, expect, it } from 'vitest';
import { Directive, directive } from './directives/directive.js';
import { t, svg } from './tag-funcs/html/index.js';
import { render, unmount } from './render.js';

let log: string[] = [];
class Probe extends Directive {
	override render(_v: string) { return 'x'; }
	override disconnected() { log.push('disconnected'); }
}
const probe = directive(Probe);

describe('render', () => {
	it('builds DOM from an t() result into the container', () => {
		const container = document.createElement('div');
		render(t`<p>Hello, ${'Ada'}!</p>`, container);
		expect(container.querySelector('p')!.textContent).toBe('Hello, Ada!');
	});

	it('clears any pre-existing content in the container on first render', () => {
		const container = document.createElement('div');
		container.textContent = 'old content';
		render(t`<p>new</p>`, container);
		expect(container.textContent).toBe('new');
	});

	it('reuses the same DOM across repeated renders from the same call site, patching only values', () => {
		const container = document.createElement('div');
		const view = (name: string) => t`<p class=${name}>${name}</p>`;
		render(view('Ada'), container);
		const p = container.querySelector('p');

		render(view('Grace'), container);
		expect(container.querySelector('p')).toBe(p); // same element, reused
		expect(p!.textContent).toBe('Grace');
		expect(p!.getAttribute('class')).toBe('Grace');
	});

	it('binds .-prefixed attributes to JS properties (not HTML attributes)', () => {
		const container = document.createElement('div');
		const view = (value: string) => t`<input .value=${value} />`;
		render(view('hello'), container);
		const input = container.querySelector('input')!;
		expect(input.value).toBe('hello');
		expect(input.hasAttribute('value')).toBe(false);

		render(view('world'), container);
		expect(container.querySelector('input')).toBe(input);
		expect(input.value).toBe('world');
	});

	it('tears down and rebuilds fresh when switching to a different template literal', () => {
		const container = document.createElement('div');
		render(t`<p>${'x'}</p>`, container);
		const p = container.querySelector('p');

		render(t`<div>${'x'}</div>`, container);
		expect(container.querySelector('p')).toBeNull();
		expect(container.querySelector('div')).not.toBeNull();
		expect(p).not.toBe(container.firstElementChild);
	});

	it('supports rendering svg() results, with elements in the SVG namespace', () => {
		const container = document.createElement('div');
		render(svg`<circle r=${3} />`, container);
		const circle = container.querySelector('circle')!;
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('tracks renders per-container independently', () => {
		const containerA = document.createElement('div');
		const containerB = document.createElement('div');
		const view = (name: string) => t`<p>${name}</p>`;
		render(view('A'), containerA);
		render(view('B'), containerB);
		expect(containerA.textContent).toBe('A');
		expect(containerB.textContent).toBe('B');
	});

	it('renders nested t() parts embedded in a parent and patches them in place', () => {
		const container = document.createElement('div');
		const badge = (label: string) => t`<span class="badge">${label}</span>`;
		const view = (label: string) => t`<p>Status: ${badge(label)}</p>`;

		render(view('ok'), container);
		expect(container.querySelector('.badge')!.textContent).toBe('ok');

		render(view('fail'), container);
		expect(container.querySelectorAll('.badge')).toHaveLength(1);
		expect(container.querySelector('.badge')!.textContent).toBe('fail');
	});

	it('switches child content with if/else between different t() parts', () => {
		const container = document.createElement('div');
		const success = (msg: string) => t`<p class="ok">${msg}</p>`;
		const error = (msg: string) => t`<p class="err">${msg}</p>`;
		const view = (ok: boolean, msg: string) =>
			t`<section>${ok ? success(msg) : error(msg)}</section>`;

		render(view(true, 'saved'), container);
		expect(container.querySelector('.ok')!.textContent).toBe('saved');
		expect(container.querySelector('.err')).toBeNull();

		render(view(false, 'failed'), container);
		expect(container.querySelector('.ok')).toBeNull();
		expect(container.querySelector('.err')!.textContent).toBe('failed');
	});

	it('renders a list of t() parts from map() or a for-loop array', () => {
		const row = (label: string) => t`<li>${label}</li>`;

		const fromMap = document.createElement('div');
		render(t`<ul>${['one', 'two'].map(row)}</ul>`, fromMap);
		expect(Array.from(fromMap.querySelectorAll('li')).map(li => li.textContent)).toEqual([
			'one',
			'two',
		]);

		const fromLoop = document.createElement('div');
		const rows = [];
		for (const label of ['alpha', 'beta']) rows.push(row(label));
		render(t`<ul>${rows}</ul>`, fromLoop);
		expect(Array.from(fromLoop.querySelectorAll('li')).map(li => li.textContent)).toEqual([
			'alpha',
			'beta',
		]);

		render(t`<ul>${['ONE', 'two'].map(row)}</ul>`, fromMap);
		expect(Array.from(fromMap.querySelectorAll('li')).map(li => li.textContent)).toEqual([
			'ONE',
			'two',
		]);
	});
});

describe('unmount', () => {
	it('disconnects directives and empties the container', () => {
		log = [];
		const c = document.createElement('div');
		render(t`<p>${probe('a')}</p>`, c);
		unmount(c);
		expect(log).toEqual(['disconnected']);
		expect(c.innerHTML).toBe('');
	});
	it('render() disconnects when a different template replaces the old one', () => {
		log = [];
		const c = document.createElement('div');
		render(t`<p>${probe('a')}</p>`, c);
		render(t`<b>${'z'}</b>`, c);
		expect(log).toEqual(['disconnected']);
	});
});
