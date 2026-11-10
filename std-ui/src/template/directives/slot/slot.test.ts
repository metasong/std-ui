import { describe, expect, it } from 'vitest';
import { t } from '../../html.js';
import { render } from '../../render.js';
import { slot } from './index.js';
import { snapshotLightChildren } from './slot-content.js';

function makeHost(inner: string): HTMLElement {
	const host = document.createElement('div');
	host.innerHTML = inner;
	snapshotLightChildren(host);
	return host;
}

describe('slot directive (light DOM)', () => {
	it('projects named and default content', () => {
		const host = makeHost('<h1 slot="title">T</h1><p>body</p>');
		host.replaceChildren(); // what a component's first render would clear
		render(t`<header>${slot('title')}</header><main>${slot()}</main>`, host, { host });
		expect(host.querySelector('header')!.firstElementChild!.outerHTML).toBe('<h1 slot="title">T</h1>');
		expect(host.querySelector('main')!.textContent).toBe('body');
	});

	it('renders fallback only when the slot is empty', () => {
		const host = makeHost('<h1 slot="title">T</h1>');
		host.replaceChildren();
		render(t`${slot('title', t`<i>x</i>`)}|${slot('footer', t`<small>f</small>`)}`, host, { host });
		expect(host.querySelector('i')).toBeNull();
		expect(host.querySelector('small')!.textContent).toBe('f');
	});

	it('keeps content stable across re-renders', () => {
		const host = makeHost('<p>body</p>');
		host.replaceChildren();
		const view = () => t`<main>${slot()}</main>`;
		render(view(), host, { host });
		const p = host.querySelector('p');
		render(view(), host, { host });
		expect(host.querySelector('p')).toBe(p);
		expect(host.querySelectorAll('p').length).toBe(1);
	});
});
