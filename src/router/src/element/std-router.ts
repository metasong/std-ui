import { attribute, signal, state, tag, UIElement } from '@std-ui/core';
import { Router, createRouter } from '../router/router.js';
import type { AnnounceFn } from '../router/announcer.js';
import type { NavigationLike } from '../navigation/types.js';
import type { RouteDef } from '../types.js';

/** Hosts a `Router`. Descendant `<std-route>` / `<std-outlet>` find it by DOM ancestry. */
@tag('std-router')
export class StdRouter extends UIElement {
	/** Attribute `base`: URL prefix the app is served under. Read once, when the router is built. */
	@attribute() base = state('');
	/** Boolean attribute `view-transition`: commit navigations inside a View Transition. Read once, when the router is built. */
	@attribute() viewTransition = false;
	/** Config-table routes; set before the element connects. */
	routes?: RouteDef[];
	/** Override `window.navigation`; set before the element connects. */
	navigation?: NavigationLike;
	/** Attribute `announce`: `"off"` disables the live-region announcer. Read once, when the router is built. */
	@attribute() announce: 'on' | 'off' = 'on';
	/** Custom announcement text; set before connecting. The default announcer is used if not set. Takes precedence over `announce`. */
	announceFn?: AnnounceFn;
	readonly #current = signal<Router | undefined>(undefined); // the only writer is the `router` accessors
	#started = false;
	#defaultRouter?: Router; // the router built from attributes; `base` changes are forwarded to it only

	/**
	 * The router; a default one is built from `routes`/`navigation`/attributes on first read.
	 * Reactive: reading it inside an effect re-runs when `router` is assigned later.
	 */
	get router(): Router {
		let router = this.#current();
		if (!router) {
			router = createRouter({
				routes: this.routes,
				base: this.base.peek(),
				navigation: this.navigation,
				announce: this.announceFn ?? this.announce !== 'off',
				viewTransition: this.viewTransition,
			});
			this.#defaultRouter = router;
			this.#current.set(router);
		}
		return router;
	}

	/** Replaces the router (descendants re-bind). The previous one is stopped; the new one starts if this element already did. */
	set router(value: Router) {
		const previous = this.#current.peek();
		if (previous === value) return;
		previous?.stop();
		this.#current.set(value);
		if (this.#started && this.isConnected) void value.start();
	}

	protected override connect(): void {
		// A template binding sets `base` after connect, so forward later values to the router instead of reading once.
		this.effect(() => {
			const base = this.base();
			if (this.#defaultRouter) this.#defaultRouter.base = base;
		});
		void this.router; // exist before descendants connect, so <std-route>s can register synchronously
		// Deferred so descendant <std-route>s (connected after this element, in the same pass) register first.
		queueMicrotask(() => {
			if (!this.isConnected) return;
			this.#started = true;
			void this.router.start();
		});
	}

	protected override disconnect(): void {
		this.#started = false;
		this.#current.peek()?.stop();
	}
}