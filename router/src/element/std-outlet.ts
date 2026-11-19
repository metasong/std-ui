import { tag, UIElement } from '@std-ui/core';
import { countAncestors, findRouterSignal } from './dom.js';
import type { RouteDef, RouteMatch } from '../types.js';

/** Renders the match at its nesting depth (number of ancestor outlets within the same `<std-router>`). */
@tag('std-outlet')
export class StdOutlet extends UIElement {
	#shown: { route: RouteDef; key: string | HTMLTemplateElement; el: Element | null } | null = null;

	protected override connect(): void {
		const current = findRouterSignal(this);
		if (!current) {
			console.warn('<std-outlet> must be inside <std-router>', this);
			return;
		}
		const depth = countAncestors(this, 'std-outlet');
		let match: RouteMatch | undefined;
		let error: unknown;
		let data: ReadonlyMap<RouteDef, unknown>;

		this.effect(
			() => {
				const router = current(); // re-runs when `<std-router>.router` is replaced
				match = router?.matches()[depth];
				error = router?.error();
				data = router?.data() ?? new Map();
			},
			() => this.#show(match, error, data.get(match?.route as RouteDef)),
		);
	}

	protected override disconnect(): void {
		this.#clear();
	}

	#clear(): void {
		this.replaceChildren();
		this.#shown = null;
	}

	#show(match: RouteMatch | undefined, error: unknown, data: unknown): void {
		if (!match) return this.#clear();
		const { route } = match;
		const tagName = error !== undefined && route.errorElement ? route.errorElement : route.element;
		const key = tagName ?? route.template;
		if (!key) return this.#clear();

		if (this.#shown?.route !== route || this.#shown.key !== key) {
			const el = tagName ? document.createElement(tagName) : null;
			if (el) this.replaceChildren(el);
			else this.replaceChildren((key as HTMLTemplateElement).content.cloneNode(true));
			this.#shown = { route, key, el };
		}
		const el = this.#shown.el;
		if (el) Object.assign(el, { params: match.params, data, error, route });
	}
}
