import { css, t, tag, UIElement } from '@std-ui/core';
import { PAGES, pageOf } from './pages.js';
import { routerOf } from './router-of.js';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

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
				${PAGES.map((p) => t`<a href="${BASE + p.path}" aria-current="${p === current ? 'page' : null}">${p.label}</a>`)}
				${current && current.sections.length
					? t`<span class="sep"></span><span class="label">On this page</span>
						${current.sections.map(([id, label]) => t`<a href="#${id}" aria-current="${hash === '#' + id ? 'location' : null}">${label}</a>`)}`
					: ''}
			</nav>
		`;
	}
}
