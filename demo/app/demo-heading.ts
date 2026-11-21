import { css, t, tag, UIElement } from '@std-ui/core';
import { pageOf } from './pages.js';
import { routerOf } from './router-of.js';

/** Heading of the current demo page. */
@tag('demo-heading')
export class DemoHeading extends UIElement {
	static override styles = css`
		.demo-app-bar {
			background: var(--std-sys-color-surface-container);
			box-shadow: var(--std-elevation-1);
			padding: 1.25rem 1.5rem 1rem;
		}

		.demo-app-bar h1 {
			margin: 0 0 0.25rem;
			font-size: 1.75rem;
			font-weight: 400;
			letter-spacing: 0;
			color: var(--std-sys-color-on-surface);
		}

		.demo-app-bar .lead {
			margin: 0;
			max-width: 52rem;
			font-size: 0.95rem;
			color: var(--std-sys-color-on-surface-variant);
		}
	`;

	protected override template() {
		const page = pageOf(routerOf(this).location().pathname);
		return t`<header class="demo-app-bar"><h1>${page?.heading ?? 'std-ui'}</h1><p class="lead">${page?.lead ?? ''}</p></header>`;
	}
}
