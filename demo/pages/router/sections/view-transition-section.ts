// Router `viewTransition`: each commit runs inside document.startViewTransition.
import { css, state, t, tag, UIElement } from '@std-ui/core';
import '@std-ui/router';
import { createRouter } from '@std-ui/router';
import { createMemoryNavigation } from '@std-ui/router/testing';
import { demoRoutes, navigateWithTransitionName } from './pages.js';

// One CSS block per name below, selected by `<html data-rt-effect>`.
const EFFECTS = ['slide', 'zoom', 'flip', 'blur', 'wipe', 'spin'] as const;

// Scoped to this element (light DOM: wrapped in `@scope (demo-router-view-transition-section)`).
const elementStyles = css`
	.demo-rt-outlet { display: block; min-height: 8rem; }
`;

// View-transition pseudo-elements hang off `:root`, outside any element scope, so these rules must live on
// `document`. Adopted while the element is connected (see `connect`/`disconnect`).
const transitionStyles = css`
	::view-transition-group(demo-rt) { animation-duration: 500ms; }
	::view-transition-old(demo-rt), ::view-transition-new(demo-rt) { animation-duration: 500ms; animation-fill-mode: both; mix-blend-mode: normal; }

	/* slide */
	:root[data-rt-effect='slide']::view-transition-old(demo-rt) { animation-name: rt-slide-out; }
	:root[data-rt-effect='slide']::view-transition-new(demo-rt) { animation-name: rt-slide-in; }
	@keyframes rt-slide-out { to { opacity: 0; transform: translateX(-120px); } }
	@keyframes rt-slide-in { from { opacity: 0; transform: translateX(120px); } }

	/* zoom */
	:root[data-rt-effect='zoom']::view-transition-old(demo-rt) { animation-name: rt-zoom-out; }
	:root[data-rt-effect='zoom']::view-transition-new(demo-rt) { animation-name: rt-zoom-in; }
	@keyframes rt-zoom-out { to { opacity: 0; transform: scale(1.4); } }
	@keyframes rt-zoom-in { from { opacity: 0; transform: scale(0.6); } }

	/* flip */
	:root[data-rt-effect='flip']::view-transition-old(demo-rt) { animation-name: rt-flip-out; }
	:root[data-rt-effect='flip']::view-transition-new(demo-rt) { animation-name: rt-flip-in; }
	@keyframes rt-flip-out { to { opacity: 0; transform: perspective(600px) rotateY(-90deg); } }
	@keyframes rt-flip-in { from { opacity: 0; transform: perspective(600px) rotateY(90deg); } }

	/* blur */
	:root[data-rt-effect='blur']::view-transition-old(demo-rt) { animation-name: rt-blur-out; }
	:root[data-rt-effect='blur']::view-transition-new(demo-rt) { animation-name: rt-blur-in; }
	@keyframes rt-blur-out { to { opacity: 0; filter: blur(16px); } }
	@keyframes rt-blur-in { from { opacity: 0; filter: blur(16px); } }

	/* wipe: new page revealed left to right */
	:root[data-rt-effect='wipe']::view-transition-old(demo-rt) { animation: none; }
	:root[data-rt-effect='wipe']::view-transition-new(demo-rt) { animation-name: rt-wipe; }
	@keyframes rt-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

	/* spin */
	:root[data-rt-effect='spin']::view-transition-old(demo-rt) { animation-name: rt-spin-out; }
	:root[data-rt-effect='spin']::view-transition-new(demo-rt) { animation-name: rt-spin-in; }
	@keyframes rt-spin-out { to { opacity: 0; transform: rotate(-20deg) scale(0.5); } }
	@keyframes rt-spin-in { from { opacity: 0; transform: rotate(20deg) scale(0.5); } }
`;

@tag('demo-router-view-transition-section')
export class DemoRouterViewTransitionSection extends UIElement {
	static override styles = elementStyles;

	private readonly chosen = state<string>('(none yet)');
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
		document.documentElement.dataset.rtEffect = next;
		this.chosen.set(next);
		// Named only for this navigation: a transition elsewhere on the page must not animate this outlet.
		void navigateWithTransitionName(this.querySelector('.demo-rt-outlet'), 'demo-rt', () => this.router.navigate(path));
	}

	protected override template() {
		const { router } = this;
		return t`
			<section class="demo-router-block" id="view-transition">
				<h2>View transitions</h2>
				<p class="desc">
					With <code>viewTransition: true</code> (or the <code>view-transition</code> attribute) the commit runs inside
					<code>document.startViewTransition</code>, so the outlet content animates between pages. Style it with
					<code>::view-transition-old/new(name)</code>; here the outlet gets <code>view-transition-name: demo-rt</code> while this section navigates (the name is document-wide, so it is not left on permanently).
					Each click picks a random effect by setting <code>data-rt-effect</code> on <code>&lt;html&gt;</code> before navigating.
					Unsupported browsers and <code>prefers-reduced-motion</code> get a plain swap.
				</p>
				<std-router .router=${router}>
					<p>
						<button @click=${() => this.go('/')}>Home</button>
						<button @click=${() => this.go('/products')}>Products</button>
						<button @click=${() => this.go('/contact')}>Contact</button>
						<small>effect: <output>${this.chosen()}</output></small>
					</p>
					<std-outlet class="demo-rt-outlet"></std-outlet>
				</std-router>
			</section>
		`;
	}
}
