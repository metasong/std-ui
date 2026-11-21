import { css, state, t, tag, UIElement } from '@std-ui/core';
import { applyTheme, currentTheme, type ThemeMode } from './theme.js';
import { pageOf } from './pages.js';
import { routerOf } from './router-of.js';

/** Heading of the current demo page. */
@tag('demo-heading')
export class DemoHeading extends UIElement {
	readonly #theme = state<ThemeMode>(currentTheme());
	static override styles = css`
		.demo-app-bar {
			background: var(--std-sys-color-surface-container);
			box-shadow: var(--std-elevation-1);
			padding: 1.25rem 1.5rem 1rem;
		}

		.demo-app-bar { position: relative; }

		.demo-theme-toggle {
			position: absolute; top: 1rem; right: 1.25rem;
			padding: 0.4rem 0.9rem; border-radius: 999px; cursor: pointer;
			border: 1px solid var(--std-sys-color-outline); background: transparent; color: var(--std-sys-color-on-surface);
			font: 500 0.8125rem/1 Roboto, sans-serif;
		}

		.demo-theme-toggle:hover { background: color-mix(in srgb, var(--std-sys-color-primary) 12%, transparent); }

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
		return t`<header class="demo-app-bar"><button type="button" class="demo-theme-toggle" aria-label="Switch to ${this.#theme() === 'dark' ? 'light' : 'dark'} theme" @click=${() => { const next = this.#theme.peek() === 'dark' ? 'light' : 'dark'; applyTheme(next); this.#theme.set(next); }}>${this.#theme() === 'dark' ? 'Light' : 'Dark'} theme</button><h1>${page?.heading ?? 'std-ui'}</h1><p class="lead">${page?.lead ?? ''}</p></header>`;
	}
}

