import { t, tag, UIElement } from '@std-ui/core';
import { pageOf } from './pages.js';
import { routerOf } from './router-of.js';

/** Heading of the current demo page. */
@tag('demo-heading')
export class DemoHeading extends UIElement {
	protected override template() {
		const page = pageOf(routerOf(this).location().pathname);
		return t`<header class="demo-app-bar"><h1>${page?.heading ?? 'std-ui'}</h1><p class="lead">${page?.lead ?? ''}</p></header>`;
	}
}
