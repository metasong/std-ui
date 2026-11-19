// Shared by the router sections: three tiny pages as template routes, and an in-memory Navigation API so
// the demo never touches the address bar (the real-URL router demo is the "Full router" section of `router.html`).
import type { RouteDef } from '@std-ui/router';

const page = (path: string, title: string, body: string): RouteDef => {
	const template = document.createElement('template');
	template.innerHTML = `<div class="rt-page"><h2>${title}</h2><p>${body}</p></div>`;
	return { path, title, template };
};

export const demoRoutes = (): RouteDef[] => [
	page('/', 'Home', 'Welcome. This is the first page.'),
	page('/products', 'Products', 'A list of products would go here.'),
	page('/contact', 'Contact', 'A contact form would go here.'),
];
