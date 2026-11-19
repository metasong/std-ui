// `<demo-nav>`: sticky top bar shared by every demo page.
//
//   <demo-nav>
//     <a href="#form">Native form</a>   <!-- in-page section anchors, optional -->
//   </demo-nav>
//
// It renders the links to the other demo pages itself (the current page is marked), a divider, and then the
// slotted anchors. The anchor for the section in `location.hash` gets `aria-current`. Sticky positioning is
// built in: put the element directly under `<body>` (not inside an `overflow` container).
import { css, t, tag, UIElement, state } from '@std-ui/core';

// Relative to any page one level below `demo/` (feature-demo/, integration-demo/, browser-bundle/).
const pages = [
	{ href: '../index.html', label: '← Demos' },
	{ href: '../feature-demo/index.html', label: 'tour' },
	{ href: '../feature-demo/bind.html', label: 'bind' },
	{ href: '../feature-demo/virtualize.html', label: 'virtualize' },
	{ href: '../feature-demo/slot.html', label: 'slot' },
	{ href: '../integration-demo/index.html', label: 'integration' },
	{ href: '../router-demo/index.html', label: 'router' },
	{ href: '../browser-bundle/index.html', label: 'browser bundle' },
] as const;

const isCurrentPage = (href: string) => new URL(href, location.href).pathname === location.pathname;

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
		a, ::slotted(a) {
			flex: none; padding: 0.35rem 0.75rem; border-radius: 999px; font: 500 0.875rem/1.2 Roboto, sans-serif;
			color: var(--md-sys-color-on-surface-variant, #49454f); text-decoration: none;
		}
		a:hover, ::slotted(a:hover) {
			background: color-mix(in srgb, var(--md-sys-color-primary, #6750a4) 10%, transparent);
			color: var(--md-sys-color-primary, #6750a4);
		}
		a[aria-current], ::slotted(a[aria-current]) {
			background: var(--md-sys-color-secondary-container, #e8def8);
			color: var(--md-sys-color-on-secondary-container, #1d192b);
		}
		.sep { flex: none; width: 1px; height: 1.25rem; margin: 0 0.5rem; background: var(--md-sys-color-outline-variant, #cac4d0); }
		.label { flex: none; padding: 0 0.5rem; font: 400 0.75rem/1 Roboto, sans-serif; letter-spacing: 0.04em; text-transform: uppercase; color: var(--md-sys-color-outline, #79747e); }
		slot { display: contents; }
	`;

	private readonly hash = state(location.hash);

	protected override firstRendered(): void {
		const sync = () => {
			this.hash.set(location.hash);
			for (const a of this.querySelectorAll('a')) {
				if (a.getAttribute('href') === location.hash) a.setAttribute('aria-current', 'location');
				else a.removeAttribute('aria-current');
			}
		};
		window.addEventListener('hashchange', sync);
		sync();
	}

	protected override template() {
		this.hash(); // re-render marker only; highlighting of slotted anchors is done in `sync`
		const hasSections = this.querySelector('a') !== null;
		return t`
			<nav aria-label="Demos and sections">
				${pages.map(p => t`<a href="${p.href}" aria-current="${isCurrentPage(p.href) ? 'page' : null}">${p.label}</a>`)}
				${hasSections ? t`<span class="sep"></span><span class="label">On this page</span>` : ''}
				<slot></slot>
			</nav>
		`;
	}
}
