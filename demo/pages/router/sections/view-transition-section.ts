// Router `viewTransition`: each commit runs inside document.startViewTransition.
import { css, t, tag, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';
import '@std-ui/router';
import { createRouter } from '@std-ui/router';
import { createMemoryNavigation } from '@std-ui/router/testing';
import { demoRoutes } from './pages.js';
import transitionStyles from './view-transition-section.css.js';

// One CSS block per name below, selected by `<html data-rt-effect>`.
const EFFECTS = ['slide', 'zoom', 'flip', 'blur', 'wipe', 'spin'] as const;

// Scoped to this element (light DOM: wrapped in `@scope (demo-router-view-transition-section)`).
const elementStyles = css`
	.demo-rt-outlet { display: block; min-height: 8rem; }
`;

@tag('demo-router-view-transition-section')
export class DemoRouterViewTransitionSection extends UIElement {
	static override styles = elementStyles;

	private readonly chosen = stateTree<string>('(none yet)');
	private readonly router = createRouter({
		routes: demoRoutes(),
		navigation: createMemoryNavigation('/'),
		viewTransition: true,
		announce: false, // this section is only about the animation
	});

	protected override connect(): void {
		const sheet = transitionStyles.styleSheet;
		if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
	}

	protected override disconnect(): void {
		document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== transitionStyles.styleSheet);
		delete document.documentElement.dataset.rtEffect;
	}

	/** Picks a random effect (never the same twice in a row), then navigates; the router runs the commit in a view transition. */
	private go(path: string): void {
		const choices = EFFECTS.filter((e) => e !== document.documentElement.dataset.rtEffect);
		const next = choices[Math.floor(Math.random() * choices.length)]!;
		document.documentElement.dataset.rtEffect = next; // data-rt-effect = 'next' on <html> selects the animation style
		this.chosen.set(next);
		void this.router.navigate(path);
	}

	protected override template() {
		const { router } = this;
		return t`
			<section class="demo-router-block" id="view-transition">
				<h2>View transitions</h2>
				<p class="desc">
					With <code>viewTransition: true</code> (or the <code>view-transition</code> attribute) the commit runs inside
					<code>document.startViewTransition</code>, so the outlet content animates between pages. Style it with
					<code>::view-transition-old/new(name)</code>; here <code>&lt;std-outlet view-transition-name="demo-rt"&gt;</code> gives the outlet that name only while this router's transition runs (the name is document-wide, so it is not left on permanently).
					Each click picks a random effect by setting <code>data-rt-effect</code> on <code>&lt;html&gt;</code> before navigating.
					Unsupported browsers and <code>prefers-reduced-motion</code> get a plain swap.
				</p>
				<std-router .router=${router}>
					<p>
						<button @click=${() => this.go('/')}>Home</button>
						<button @click=${() => this.go('/products')}>Products</button>
						<button @click=${() => this.go('/contact')}>Contact</button>
						<small>effect: <output>${this.chosen.get()}</output></small>
					</p>
					<std-outlet class="demo-rt-outlet" view-transition-name="demo-rt"></std-outlet>
				</std-router>
			</section>
		`;
	}
}
