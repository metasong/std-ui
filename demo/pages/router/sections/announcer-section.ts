// Router `announce`: a screen-reader message after each client-side navigation.
import { stateTree, t, tag, UIElement } from '@std-ui/core';
import '@std-ui/router';
import { createRouter } from '@std-ui/router';
import { createMemoryNavigation } from '@std-ui/router/testing';
import { demoRoutes } from './pages.js';

@tag('demo-router-announcer-section')
export class DemoRouterAnnouncerSection extends UIElement {
	private readonly heard = stateTree('(navigate to hear something)');

	// Custom `announce`: same default text, plus we mirror it on screen. Return '' to stay silent.
	private readonly router = createRouter({
		routes: demoRoutes(),
		navigation: createMemoryNavigation('/'),
		announce: ({ matches }) => {
			const text = `Navigated to ${matches.at(-1)?.route.title ?? 'unknown page'}`;
			this.heard.set(text);
			return text;
		},
	});

	protected override template() {
		const { router } = this;
		return t`
			<section class="demo-router-block" id="announcer">
				<h2>Live-region announcer</h2>
				<p class="desc">
					Client-side navigations load no page, so screen readers say nothing. With <code>announce</code> the router
					writes a message into a hidden <code>aria-live="polite"</code> region after each navigation (not the
					initial load). Default text: route <code>title</code>, else first <code>&lt;h1&gt;</code>, else the path.
				</p>
				<std-router .router=${router}>
					<p>
						<button @click=${() => router.navigate('/')}>Home</button>
						<button @click=${() => router.navigate('/products')}>Products</button>
						<button @click=${() => router.navigate('/contact')}>Contact</button>
					</p>
					<std-outlet></std-outlet>
				</std-router>
				<p><strong>Screen reader hears:</strong> <output>${this.heard()}</output></p>
			</section>
		`;
	}
}
