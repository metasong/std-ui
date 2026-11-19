import { tag, UIElement } from '@std-ui/core';
import { Router, createRouter } from '../router/router.js';
import type { NavigationLike } from '../navigation/types.js';
import type { RouteDef } from '../types.js';

/** Hosts a `Router`. Descendant `<std-route>` / `<std-outlet>` find it by DOM ancestry. */
@tag('std-router')
export class StdRouter extends UIElement {
	/** Config-table routes; set before the element connects. */
	routes?: RouteDef[];
	/** Override `window.navigation`; set before the element connects. */
	navigation?: NavigationLike;
	#router?: Router;

	get router(): Router {
		return (this.#router ??= createRouter({
			routes: this.routes,
			base: this.getAttribute('base') ?? '',
			navigation: this.navigation,
		}));
	}

	set router(value: Router) {
		this.#router = value;
	}

	protected override connect(): void {
		// Deferred so descendant <std-route>s (connected after this element, in the same pass) register first.
		queueMicrotask(() => {
			if (this.isConnected) void this.router.start();
		});
	}

	protected override disconnect(): void {
		this.#router?.stop();
	}
}
