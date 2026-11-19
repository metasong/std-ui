// The demo app: one `<std-router>`, one `<std-route>` per demo, loaded on demand.
// Each route's `load` is a dynamic `import()` that defines the page's custom elements before the outlet renders it.
import { css, t, tag, UIElement } from '@std-ui/core';
import '@std-ui/router'; // defines <std-router>, <std-route>, <std-outlet>
import type { Router, StdRoute, StdRouter } from '@std-ui/router';

interface Page {
	path: string;
	label: string;
	element: string;
	load: () => Promise<unknown>;
	heading: string;
	lead: string;
	/** In-page anchors shown in the second nav row: `[id, label]`. */
	sections: readonly (readonly [string, string])[];
}

const PAGES: readonly Page[] = [
	{
		path: '/tour', label: 'tour', element: 'demo-feature-page', load: () => import('../pages/tour/index.js'),
		heading: 'std-ui', lead: 'Minimal UI on web standards - a tour of every feature, each in its own custom element.',
		sections: [
			['counter', 'Signals'], ['attribute', 'Attributes'], ['context', 'Context'], ['query', 'Queries'],
			['shadow', 'Shadow DOM'], ['css', 'CSS'], ['directives', 'Directives'], ['bindings', 'Bindings'],
			['todo', 'Todo'], ['map-by-key', 'Keyed lists'], ['svg', 'SVG'], ['mathml', 'MathML'],
		],
	},
	{
		path: '/bind', label: 'bind', element: 'demo-bind-page', load: () => import('../pages/bind/index.js'),
		heading: 'bind()', lead: 'Two-way property binding with live model → view and event-driven view → model.',
		sections: [['form', 'Native form'], ['custom', 'Custom property'], ['validation', 'Validation']],
	},
	{
		path: '/virtualize', label: 'virtualize', element: 'demo-virtualize-page', load: () => import('../pages/virtualize/index.js'),
		heading: 'virtualize', lead: 'Windowed lists and grids - large collections with a tiny DOM. Each block is its own custom element.',
		sections: [['vertical', 'Vertical'], ['headers', 'Headers'], ['grid', 'Grid'], ['horizontal', 'Horizontal']],
	},
	{
		path: '/slot', label: 'slot', element: 'demo-slot-page', load: () => import('../pages/slot/index.js'),
		heading: 'slot', lead: 'Slots in light DOM and shadow DOM.',
		sections: [],
	},
	{
		path: '/router', label: 'router', element: 'demo-router-page', load: () => import('../pages/router/index.js'),
		heading: 'router', lead: 'Navigation API router: markup routes, guards, loaders, announcer and view transitions. This app is itself routed by it.',
		sections: [['full-router', 'Full router'], ['announcer', 'Announcer'], ['view-transition', 'View transitions']],
	},
	{
		path: '/integration', label: 'integration', element: 'demo-integration-page', load: () => import('../pages/integration/index.js'),
		heading: 'integration', lead: 'Several features working together.',
		sections: [['signup', 'Sign-up form'], ['directory', 'People directory']],
	},
];

const routerOf = (el: Element): Router => (el.closest('std-router') as StdRouter).router;
const pageOf = (pathname: string): Page | undefined => PAGES.find((p) => pathname === p.path || pathname.startsWith(p.path + '/'));

/** Sticky top bar: the demo pages, then the current page's section anchors. */
@tag('demo-nav')
export class DemoNav extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	static override styles = css`
		:host {
			position: sticky; top: 0; z-index: 10; display: block;
			background: var(--md-sys-color-surface-container, #f3edf7);
			border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
		}
		nav { display: flex; align-items: center; gap: 0.25rem; padding: 0.5rem 1.5rem; overflow-x: auto; white-space: nowrap; scrollbar-width: none; }
		a {
			flex: none; padding: 0.35rem 0.75rem; border-radius: 999px; font: 500 0.875rem/1.2 Roboto, sans-serif;
			color: var(--md-sys-color-on-surface-variant, #49454f); text-decoration: none;
		}
		a:hover {
			background: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 10%, transparent);
			color: var(--md-sys-color-primary, #6750a4);
		}
		a[aria-current] { background: var(--md-sys-color-secondary-container, #e8def8); color: var(--md-sys-color-on-secondary-container, #1d192b); }
		.sep { flex: none; width: 1px; height: 1.25rem; margin: 0 0.5rem; background: var(--md-sys-color-outline-variant, #cac4d0); }
		.label { flex: none; padding: 0 0.5rem; font: 400 0.75rem/1 Roboto, sans-serif; letter-spacing: 0.04em; text-transform: uppercase; color: var(--md-sys-color-outline, #79747e); }
	`;

	protected override template() {
		const { pathname, hash } = routerOf(this).location();
		const current = pageOf(pathname);
		return t`
			<nav aria-label="Demos and sections">
				${PAGES.map((p) => t`<a href="${p.path}" aria-current="${p === current ? 'page' : null}">${p.label}</a>`)}
				${current && current.sections.length
					? t`<span class="sep"></span><span class="label">On this page</span>
						${current.sections.map(([id, label]) => t`<a href="#${id}" aria-current="${hash === '#' + id ? 'location' : null}">${label}</a>`)}`
					: ''}
			</nav>
		`;
	}
}

/** Heading of the current demo page. */
@tag('demo-heading')
export class DemoHeading extends UIElement {
	protected override template() {
		const page = pageOf(routerOf(this).location().pathname);
		return t`<header class="demo-app-bar"><h1>${page?.heading ?? 'std-ui'}</h1><p class="lead">${page?.lead ?? ''}</p></header>`;
	}
}

@tag('demo-not-found')
export class DemoNotFound extends UIElement {
	protected override template() {
		return t`<h2>404</h2><p>No demo at this address. <a href="/tour">Go to the tour.</a></p>`;
	}
}

@tag('demo-app')
export class DemoApp extends UIElement {
	protected override firstRendered(): void { // the <std-router> exists only once the template is rendered
		// Not `.load=` bindings in the template: such elements connect before their attributes are set, so the route would have no path.
		for (const p of PAGES) (this.querySelector(`std-route[path="${p.path}"]`) as StdRoute).load = p.load;
		// A deep link with a `#section` renders after its page loads, so the browser has nothing to scroll to yet.
		const scrollToHash = (): void => {
			if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
		};
		this.effect(() => {
			const { router } = this.querySelector('std-router') as StdRouter;
			if (router.status() === 'idle') requestAnimationFrame(scrollToHash);
		});
	}

	protected override template() {
		return t`
			<std-router announce="off" view-transition>
				<demo-heading></demo-heading>
				<demo-nav></demo-nav>
				<main class="demo-main">
					<std-outlet></std-outlet>
				</main>

				<std-route path="/" redirect="/tour"></std-route>
				<std-route path="/tour" element="demo-feature-page" title="tour - std-ui"></std-route>
				<std-route path="/bind" element="demo-bind-page" title="bind - std-ui"></std-route>
				<std-route path="/virtualize" element="demo-virtualize-page" title="virtualize - std-ui"></std-route>
				<std-route path="/slot" element="demo-slot-page" title="slot - std-ui"></std-route>
				<std-route path="/router" element="demo-router-page" title="router - std-ui"></std-route>
				<std-route path="/integration" element="demo-integration-page" title="integration - std-ui"></std-route>
				<std-route path="*" element="demo-not-found" title="Not found - std-ui"></std-route>
			</std-router>
		`;
	}
}
