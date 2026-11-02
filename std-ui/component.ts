// Tiny "component" convention for src/ui - no external UI library. Every UI piece is a native
// Custom Element: a class extending `UIElement`, registered under its own kebab-case tag name via
// `customElements.define()` (see each file in `ui/components/`).
//
// Custom elements auto-mount the instant they're inserted into the document - whether that's
// static markup in `index.html` or another component injecting them via `template()`. So parents
// can freely compose child tags without any manual mount ordering/registration anywhere.

import { store, type AppState } from '../../core/store.js';

export abstract class UIElement<S = AppState> extends HTMLElement {
	#unsubscribe?: () => void;
	#mounted = false;

	/** Optional markup injected into `this` once, before `mount()` runs. */
	template?(): string;

	/** One-time setup (resolve child nodes, attach listeners). Runs once, after any `template()` injection. */
	mount?(): void;

	/** Called with the latest state (and once immediately on connect) to sync DOM to `state`. */
	render?(state: S): void;

	connectedCallback(): void {
		if (!this.#mounted) {
			this.#mounted = true;
			if (this.template) this.innerHTML = this.template();
			this.mount?.();
		}

		this.#unsubscribe = store.subscribe(state => this.render?.(state as unknown as S));
		this.render?.(store.state as unknown as S);
	}

	disconnectedCallback(): void {
		this.#unsubscribe?.();
	}
}
