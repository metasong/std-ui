// The demo app: one `<std-router>`, one `<std-route>` per demo, loaded on demand.
import { t, tag, UIElement } from '@std-ui/core';
import '@std-ui/router'; // defines <std-router>, <std-route>, <std-outlet>
import type { StdRoute, StdRouter } from '@std-ui/router';
import './demo-heading.js';
import './demo-nav.js';
import './demo-not-found.js';
import { PAGES } from './pages.js';

@tag('demo-app')
export class DemoApp extends UIElement {
	protected override firstRendered(): void { // the <std-router> exists only once the template is rendered
		// Not `.load=` bindings in the template: such elements connect before their attributes are set, so the route would have no path.
		for (const p of PAGES) (this.querySelector(`std-route[path="${p.path}"]`) as StdRoute).load = p.load;
		// A deep link with a `#section` renders after its page loads, so the browser has nothing to scroll to yet.
		const scrollToHash = (): void => {
			if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
		};
		this.effect(() => {
			const { router } = this.querySelector('std-router') as StdRouter;
			if (router.status() === 'idle') requestAnimationFrame(scrollToHash);
		});
	}

	protected override template() {
		return t`
			<std-router announce="off" view-transition>
				<demo-heading></demo-heading>
				<demo-nav></demo-nav>
				<main class="demo-main">
					<std-outlet></std-outlet>
				</main>

				<std-route path="/" redirect="/tour"></std-route>
				<std-route path="/tour" element="demo-feature-page" title="tour - std-ui"></std-route>
				<std-route path="/bind" element="demo-bind-page" title="bind - std-ui"></std-route>
				<std-route path="/virtualize" element="demo-virtualize-page" title="virtualize - std-ui"></std-route>
				<std-route path="/slot" element="demo-slot-page" title="slot - std-ui"></std-route>
				<std-route path="/router" element="demo-router-page" title="router - std-ui"></std-route>
				<std-route path="/integration" element="demo-integration-page" title="integration - std-ui"></std-route>
				<std-route path="*" element="demo-not-found" title="Not found - std-ui"></std-route>
			</std-router>
		`;
	}
}
