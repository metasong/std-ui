// Tiny, app-agnostic "component" convention: every UI piece is a native Custom Element that
// subscribes to some `Store<S>` and re-renders on change. No external UI library, no
// knowledge of any particular app's state shape or store singleton - both are supplied by
// whoever subclasses `UIElement` (see `../ui/app-element.ts` for this app's binding, and each
// file in `ui/components/` for concrete components).
//
// Custom elements auto-mount the instant they're inserted into the document - whether that's
// static markup in `index.html` or another component injecting them via `template()`. So parents
// can freely compose child tags without any manual mount ordering/registration anywhere.

import type { Store } from './store.js';
import { effect as createEffect, type OnCleanup } from './signal.js';

/** Class decorator that registers the decorated `UIElement` subclass as a custom element under `tag`. */
export function element(tag: string) {
	return function <T extends CustomElementConstructor>(ctor: T): T {
		customElements.define(tag, ctor);
		return ctor;
	};
}

export abstract class UIElement<S extends object> extends HTMLElement {
	#unsubscribe?: () => void;
	#mounted = false;
	#effectDisposers: Array<() => void> = [];

	/** The store this component reads from and re-renders in response to. Supply via a per-app subclass. */
	protected abstract get store(): Store<S>;

	/** Optional markup injected into `this` once, before the `mount()` hook runs. */
	template?(): string;

	/** lifecycle hook: One-time setup (resolve child nodes, attach listeners). Runs once, after any `template()` injection. */
	mount?(): void;

	/** lifecycle hook: Called with the latest state (and once immediately on connect) to sync DOM to `state`. */
	render?(state: S): void;

	/** lifecycle hook: Tear down what `mount()` set up (listeners, timers). Runs on every disconnect. */
	unmount?(): void;

	/**
	 * Fine-grained alternative to `render(state)`: a `signal`/`computed`-tracking effect (see
	 * `./signal.js`), auto-disposed on disconnect. Prefer this when only a small slice of DOM
	 * needs to react to specific signals, rather than the whole component re-rendering.
	 */
	protected effect(fn: (onCleanup: OnCleanup) => void): void {
		this.#effectDisposers.push(createEffect(fn));
	}

	// Browser lifecycle entry points — `private` so TS subclasses cannot override; extend `mount` / `unmount` / `render` instead.
	/** Connected to the document (static HTML, parent markup, re-insert after remove). */
	private connectedCallback(): void {
		if (!this.#mounted) {
			this.#mounted = true;
			if (this.template) this.innerHTML = this.template();
			this.mount?.();
		}

		this.#unsubscribe = this.store.subscribe(state => this.render?.(state));
		this.render?.(this.store.state);
	}

	/** Removed from the document; unsubscribes from the store and disposes any `effect()`s. */
	private disconnectedCallback(): void {
		this.#unsubscribe?.();
		this.unmount?.();
		this.#mounted = false;
		this.#effectDisposers.forEach(dispose => dispose());
		this.#effectDisposers = [];
	}
}
