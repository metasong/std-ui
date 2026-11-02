// Tiny "component" convention for src/ui — no external UI library. A `UIComponent` is just a
// plain object naming a root element plus optional one-time setup (`mount`) and per-state-change
// sync (`render`) functions. Each component owns its own DOM lookups/listeners; nothing about it
// needs to be registered anywhere else except the registry array in `ui/components/index.ts`.
//
// This replaces the old pattern of one shared `appNodes` map + one shared `renderApp()` + one
// shared `controls-wiring.ts`, where adding a single new control meant touching every one of
// those files. Now: implement `root`/`mount`/`render` in a new file, add it to the registry array.

import type { AppState, Store } from '../../core/store.js';

export interface UIComponent<S = AppState> {
	/** CSS selector for this component's existing root element in `index.html`. */
	root: string;
	/**
	 * Optional markup injected into the root element once, before `mount()` runs — for components
	 * that render their own children from data (e.g. the settings form fields) rather than relying
	 * on static markup already present in `index.html`.
	 */
	template?: () => string;
	/** One-time DOM setup: resolve child nodes, attach event listeners. Runs once, after any `template()` injection. */
	mount?: (root: Element) => void;
	/** Called with the latest state (and once immediately at startup) to sync this component's DOM to `state`. */
	render?: (state: S, root: Element) => void;
}

/**
 * Resolves each component's root element, injects its `template()` markup (if any), then runs
 * `mount()`. Call once, after `index.html`'s static markup exists but before the first render.
 */
export function mountAll(components: UIComponent[]): void {
	components.forEach(component => {
		const root = document.querySelector(component.root);
		if (!root) {
			console.warn(`UIComponent root not found: "${component.root}"`);
			return;
		}
		if (component.template) {
			root.innerHTML = component.template();
		}
		component.mount?.(root);
	});
}

/**
 * Subscribes to `store` once, calling every component's `render()` (if present) on every state
 * change — then performs one immediate render with the current state so the initial paint
 * reflects it without waiting for the first `setState()` call.
 */
export function subscribeAll(components: UIComponent[], store: typeof Store): void {
	const renderAll = (state: AppState): void => {
		components.forEach(component => {
			if (!component.render) return;
			const root = document.querySelector(component.root);
			if (root) component.render!(state, root);
		});
	};

	store.subscribe(renderAll);
	renderAll(store.state);
}
