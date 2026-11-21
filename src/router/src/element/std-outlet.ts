import { attribute, tag, UIElement } from '@std-ui/core';
import { countAncestors, findSignalBackedRouter } from './dom.js';
import type { RouteDef, RouteMatch } from '../types.js';

/** Renders the match at its nesting depth (number of ancestor outlets within the same `<std-router>`). */
@tag('std-outlet')
export class StdOutlet extends UIElement {
	/**
	 * Attribute `view-transition-name`: the name to use (needs `view-transition` on the router). The attribute
	 * stays, but the name is applied as a style only while the router's view transition runs. Note: this sets and then removes the inline
	 * `style.view-transition-name`, so don't set that property yourself on this element.
	 */
	@attribute() viewTransitionName = '';
	#shown: { route: RouteDef; key: string | HTMLTemplateElement; el: Element | null } | null = null;

	protected override connect(): void {
		const current = findSignalBackedRouter(this);
		if (!current) {
			console.warn('<std-outlet> must be inside <std-router>', this);
			return;
		}
		const depth = countAncestors(this, 'std-outlet');
		let match: RouteMatch | undefined;
		let error: unknown;
		let data: ReadonlyMap<RouteDef, unknown>;

		this.effect((onCleanup) => {
			const removeHooks = current().addViewTransitionHooks({
				onStart: () => this.viewTransitionName && this.style.setProperty('view-transition-name', this.viewTransitionName),
				onFinish: () => this.style.removeProperty('view-transition-name'),
			});

			onCleanup(removeHooks);
		});

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

	/** Elements of `keepAlive` routes that are currently not shown. */
	#kept = new Map<RouteDef, Element>();

	#clear(): void {
		this.replaceChildren();
		this.#shown = null;
		this.#kept.clear();
	}

	#show(match: RouteMatch | undefined, error: unknown, data: unknown): void {
		if (!match) return this.#clear();
		const { route } = match;
		const tagName = error !== undefined && route.errorElement ? route.errorElement : route.element;
		const key = tagName ?? route.template;
		if (!key) return this.#clear();

		if (this.#shown?.route !== route || this.#shown.key !== key) {
			const prev = this.#shown;
			if (prev?.el && prev.route.keepAlive && prev.key === prev.route.element) this.#kept.set(prev.route, prev.el);
			const reused = route.keepAlive && tagName === route.element ? this.#kept.get(route) : undefined;
			this.#kept.delete(route);
			const el = reused ?? (tagName ? document.createElement(tagName) : null);
			if (el) this.replaceChildren(el);
			else this.replaceChildren((key as HTMLTemplateElement).content.cloneNode(true));
			this.#shown = { route, key, el };
		}
		const el = this.#shown.el;
		if (el) Object.assign(el, { params: match.params, data, error, route });
	}
}
