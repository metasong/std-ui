import { afterEach, describe, expect, it } from 'vitest';
import { createMemoryNavigation } from '../dev/index.js';
import './index.js';
import { routeParam, searchParam } from './param-decorators.js';
import type { StdRouter } from './std-router.js';
import { tag, UIElement } from '@std-ui/core';

@tag('rt-user-page')
class UserPage extends UIElement {
	params: Record<string, string> = {};
}
@tag('rt-host')
class Host extends UIElement {}
void UserPage;
void Host;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html: string, url: string): StdRouter {
	const el = document.createElement('std-router') as StdRouter;
	el.navigation = createMemoryNavigation(url);
	el.innerHTML = html;
	document.body.appendChild(el);
	return el;
}

afterEach(() => {
	document.body.innerHTML = '';
});

describe('@routeParam / @searchParam', () => {
	it('are readable inside connect()', async () => {
		let seen: { id: string | undefined; tab: string | undefined } | undefined;
		@tag('rt-param-page')
		class ParamPage extends UIElement {
			@routeParam('id') readonly userId?: string;
			@searchParam('tab') readonly tab?: string;
			protected override connect(): void {
				seen = { id: this.userId, tab: this.tab };
			}
		}
		void ParamPage;
		mount(`<std-route path="/users/:id" element="rt-param-page"></std-route><std-outlet></std-outlet>`, '/users/7?tab=a');
		await tick();
		expect(seen).toEqual({ id: '7', tab: 'a' });
	});
});

describe('<std-router> markup', () => {
	it('renders the matched route element with params', async () => {
		const el = mount(
			`<std-route path="/" element="rt-home"></std-route>
			 <std-route path="/users/:id" element="rt-user-page"></std-route>
			 <std-outlet></std-outlet>`,
			'/users/7',
		);
		await tick();
		const page = el.querySelector('std-outlet > rt-user-page') as UserPage | null;
		expect(page).not.toBeNull();
		expect(page!.params).toEqual({ id: '7' });
	});

	it('renders nested routes into nested outlets', async () => {
		const el = mount(
			`<std-route path="/users" element="rt-layout">
				<std-route index element="rt-index"></std-route>
			 </std-route>
			 <std-outlet></std-outlet>`,
			'/users',
		);
		await tick();
		expect(el.querySelector('std-outlet > rt-layout')).not.toBeNull();
		// Layout is a plain element here, so mimic a layout that hosts a child outlet.
		const layout = el.querySelector('rt-layout')!;
		layout.appendChild(document.createElement('std-outlet'));
		await tick();
		expect(layout.querySelector('std-outlet > rt-index')).not.toBeNull();
	});

	it('a router nested in a routed page renders its own outlet at depth 0', async () => {
		const outer = mount(
			`<std-route path="/" element="rt-host"></std-route><std-outlet></std-outlet>`,
			'/',
		);
		await tick();
		const inner = document.createElement('std-router') as StdRouter;
		inner.navigation = createMemoryNavigation('/');
		inner.innerHTML = `<std-route path="/"><template><p>inner</p></template></std-route><std-outlet></std-outlet>`;
		outer.querySelector('rt-host')!.appendChild(inner);
		await tick();
		expect(inner.querySelector('std-outlet p')?.textContent).toBe('inner');
	});

	it('renders inline <template> content', async () => {
		const el = mount(
			`<std-route path="/about"><template><h1>About</h1></template></std-route><std-outlet></std-outlet>`,
			'/about',
		);
		await tick();
		expect(el.querySelector('std-outlet h1')?.textContent).toBe('About');
	});

	it('follows redirect attribute', async () => {
		const el = mount(
			`<std-route path="/old" redirect="/about"></std-route>
			 <std-route path="/about"><template><p>hi</p></template></std-route>
			 <std-outlet></std-outlet>`,
			'/old',
		);
		await tick();
		await tick();
		expect(el.router.location().pathname).toBe('/about');
		expect(el.querySelector('std-outlet p')).not.toBeNull();
	});

	it('programmatic navigate() updates matches', async () => {
		const el = mount(`<std-route path="/a"></std-route><std-outlet></std-outlet>`, '/');
		await tick();
		await el.router.navigate('/a');
		expect(el.router.matches()).toHaveLength(1);
	});
});
