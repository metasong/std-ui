// Tiny, app-agnostic "component" convention: every UI piece is a native Custom Element that
// reads from some reactive `SignalTree<S>` (see `./signal/tree.js`) and re-renders whenever any
// field it touches changes. No external UI library, no knowledge of any particular app's state
// shape or state singleton - both are supplied by whoever subclasses `UIElement` (see
// `../ui/app-element.ts` for this app's binding, and each file in `ui/components/` for concrete
// components).
//
// Custom elements auto-mount the instant they're inserted into the document - whether that's
// static markup in `index.html` or another component injecting them via `template()`. So parents
// can freely compose child tags without any manual mount ordering/registration anywhere.

import {
	effect as createEffect,
	type OnCleanup,
	type SignalTree,
} from './signal/index.js';
import { render as renderHtml, type TemplateResult } from './template/index.js';

/** Class decorator that registers the decorated `UIElement` subclass as a custom element under `tag`. */
export function element(tag: string) {
	return function <T extends CustomElementConstructor>(ctor: T): T {
		customElements.define(tag, ctor);
		return ctor;
	};
}

export abstract class UIElement<S extends object> extends HTMLElement {
	#mounted = false;
	#effectDisposers: Array<() => void> = [];

	/** The reactive state tree this component reads from and re-renders in response to. Supply via a per-app subclass. */
	protected abstract get state(): SignalTree<S>;

	/** Optional markup injected into `this` once, before the `mount()` hook runs. */
	protected template?(): string;

	/** lifecycle hook: One-time setup (resolve child nodes, attach listeners). Runs once, after any `template()` injection. */
	protected mount?(): void;

	/**
	 * lifecycle hook: Called with the latest state (and once immediately on connect) to sync DOM to
	 * `state`. Either sync the DOM imperatively (`querySelector`/`textContent`/... and return
	 * nothing), or return an `html` (see `./template/html.js`) tagged-template result describing the
	 * component's full markup - the diffing in `./template/html.js` will patch only what changed
	 * since last time.
	 */
	protected render?(state: S): TemplateResult | void;

	/** lifecycle hook: Tear down what `mount()` set up (listeners, timers). Runs on every disconnect. */
	protected unmount?(): void;

	/**
	 * Fine-grained alternative to `render(state)`: a `signal`/`computed`-tracking effect (see
	 * `./signal/`), auto-disposed on disconnect. Prefer this when only a small slice of DOM
	 * needs to react to specific signals, rather than the whole component re-rendering.
	 */
	protected readonly effect = (fn: (onCleanup: OnCleanup) => void): void => {
		this.#effectDisposers.push(createEffect(fn));
	};

	// Browser lifecycle entry points — `private` so TS subclasses cannot override; extend `mount` / `unmount` / `render` instead.
	/** Connected to the document (static HTML, parent markup, re-insert after remove). */
	private connectedCallback(): void {
		if (!this.#mounted) {
			this.#mounted = true;
			if (this.template) this.innerHTML = this.template();
			this.mount?.();
		}

		// `this.state()` is a tracked read of the tree root - a `Computed` that reassembles every
		// leaf into a fresh plain object - so this effect re-runs `render()` whenever any field
		// anywhere in the tree changes (runs once synchronously now, then microtask-batched).
		this.#effectDisposers.push(createEffect(() => {
			const result = this.render?.(this.state());
			if (result) renderHtml(result, this);
		}));
	}

	/** Removed from the document; disposes the render effect and any `effect()`s set up in `mount()`. */
	private disconnectedCallback(): void {
		this.unmount?.();
		this.#mounted = false;
		this.#effectDisposers.forEach(dispose => dispose());
		this.#effectDisposers = [];
	}
}
