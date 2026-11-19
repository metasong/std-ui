// Shared by the router sections: three tiny pages as template routes, and an in-memory Navigation API so
// the demo never touches the address bar (the app itself is routed by the real router, see `demo/app/` (`main.ts`, `pages.ts`)).
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

/**
 * View transitions are document-wide: while one runs, every element with a `view-transition-name` is
 * animated, even in sections whose own router did not navigate. So a section gives its outlet the name only
 * while its own navigation's transition runs, not permanently.
 */
export async function navigateWithTransitionName(outlet: HTMLElement | null, name: string, go: () => Promise<unknown>): Promise<void> {
	if (!outlet) return void (await go());
	outlet.style.viewTransitionName = name;
	// Catch the transition the router starts, to know when it is over (the router resolves earlier, at the DOM update).
	type Start = (cb: () => unknown) => { finished: Promise<unknown> };
	const doc = document as unknown as { startViewTransition?: Start };
	const original = doc.startViewTransition;
	let finished: Promise<unknown> = Promise.resolve();
	if (original) {
		doc.startViewTransition = function (this: unknown, cb) {
			const transition = original.call(this, cb);
			finished = transition.finished;
			return transition;
		};
	}
	try {
		await go();
	} finally {
		if (original) doc.startViewTransition = original;
		void finished.catch(() => {}).finally(() => { outlet.style.viewTransitionName = ''; });
	}
}