import { tag, UIElement } from '@std-ui/core';
import { findAncestor, findSignalBackedRouter } from './dom.js';
import type { Router } from '../router/router.js';
import type { GuardResult, RouteContext, RouteDef } from '../types.js';

/** Declarative route; inert in the DOM. Attributes are read once, when `def` is first built. */
@tag('std-route')
export class StdRoute extends UIElement {
	guard?: (ctx: RouteContext) => GuardResult | Promise<GuardResult>;
	load?: (ctx: RouteContext) => unknown;
	#def?: RouteDef;
	#unregister?: () => void;

	/** Lazily built so a child can reach its parent's def before the parent has connected. */
	get def(): RouteDef {
		if (this.#def) return this.#def;
		const attr = (name: string): string | undefined => this.getAttribute(name) ?? undefined;
		const src = attr('src');
		const meta: Record<string, unknown> = {};
		for (const a of Array.from(this.attributes)) if (a.name.startsWith('meta-')) meta[a.name.slice(5)] = a.value;
		return (this.#def = {
			path: attr('path'),
			index: this.hasAttribute('index'),
			element: attr('element'),
			redirect: attr('redirect'),
			errorElement: attr('error-element'),
			keepAlive: this.hasAttribute('keep-alive'),
			title: attr('title'),
			meta,
			template: this.querySelector(':scope > template') ?? undefined,
			lazy: src ? () => import(/* @vite-ignore */ new URL(src, document.baseURI).href) : undefined,
			guard: (ctx) => this.guard?.(ctx),
			load: (ctx) => this.load?.(ctx),
			children: [],
		});
	}

	protected override connect(): void {
		this.hidden = true;
		const current = findSignalBackedRouter(this);
		if (!current) {
			console.warn('<std-route> must be inside <std-router>', this);
			return;
		}
		const parent = findAncestor<StdRoute>(this, 'std-route');
		let registeredWith: Router | undefined;
		const register = (router: Router | undefined): void => {
			if (router === registeredWith) return;
			this.#unregister?.();
			registeredWith = router;
			this.#unregister = router?.addRoute(this.def, parent?.def);
		};
		let next: Router | undefined;
		// The first run is synchronous (so routes exist before the router starts); re-runs move the
		// route to a replacement router.
		this.effect(
			() => {
				next = current();
			},
			() => register(next),
		);
	}

	protected override disconnect(): void {
		this.#unregister?.();
		this.#unregister = undefined;
		this.#def = undefined;
	}
}
