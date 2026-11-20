// The demo's pages: one entry per route. Each `load` is a dynamic `import()` that defines the page's custom elements
// before the outlet renders it.

export interface Page {
	path: string;
	label: string;
	element: string;
	load: () => Promise<unknown>;
	heading: string;
	lead: string;
	/** In-page anchors shown in the second nav row: `[id, label]`. */
	sections: readonly (readonly [string, string])[];
}

export const PAGES: readonly Page[] = [
	{
		path: '/tour', label: 'tour', element: 'demo-feature-page', load: () => import('../pages/tour/index.js'),
		heading: 'std-ui', lead: 'Minimal UI on web standards - a tour of every feature, each in its own custom element.',
		sections: [
			['counter', 'Signals'], ['attribute', 'Attributes'], ['context', 'Context'], ['query', 'Queries'],
			['shadow', 'Shadow DOM'], ['css', 'CSS'], ['directives', 'Directives'], ['bindings', 'Bindings'], ['event-extensions', 'Event ext'],
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

export const pageOf = (pathname: string): Page | undefined => PAGES.find((p) => pathname === p.path || pathname.startsWith(p.path + '/'));
