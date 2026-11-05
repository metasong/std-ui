// Tiny, app-agnostic "component" convention: every UI piece is a native Custom Element whose
// `template()` reads whatever `signal`/`computed` values it needs directly (see `./signal/`) and
// re-renders whenever any of those it touches changes. No external UI library, no knowledge of
// any particular app's state shape baked into the base class.
//
// Custom elements auto-connect the instant they're inserted into the document - whether that's
// static markup in `index.html` or another component injecting them while assembling its own
// markup. So parents can freely compose child tags without any manual connect ordering/registration
// anywhere.

import {
	defineObservedAttributes,
	getAttributeDefs,
	parseAttribute,
	wireConsumedContextFields,
	wireProvidedContextListeners,
	wireReflectedAttributes,
} from './decorators/index.js';
import {
	effect as createEffect,
	type OnCleanup,
} from './signal/index.js';
import { render, type TemplateResult } from './template/index.js';

export {
	attribute,
	consume,
	createContextKey,
	state,
	type AttributeConverter,
	type AttributeOptions,
	type AttributeType,
	type ContextKey,
	type StateOptions,
} from './decorators/index.js';

/**
 * Class decorator that registers the decorated `UIElement` subclass as a custom element under
 * `name`. Also wires up `observedAttributes` from any `@attribute()`-decorated fields (see
 * `./decorators/`) so the browser calls `attributeChangedCallback` for them - must run before
 * `customElements.define()`, which reads `observedAttributes` once, at definition time.
 */
export function tag(name: string) {
	return function <T extends CustomElementConstructor>(ctor: T, context: ClassDecoratorContext): T {
		defineObservedAttributes(ctor, context);
		customElements.define(name, ctor);
		return ctor;
	};
}

export abstract class UIElement extends HTMLElement {
	#connected = false;
	#firstRenderDone = false;
	#effectDisposers: Array<() => void> = [];
	#contextListenerDisposers: Array<() => void> = [];

	/** lifecycle hook: One-time setup (resolve child nodes, attach listeners, inject any static markup). */
	protected connect?(): void;

	/**
	 * lifecycle hook: Called with the latest state (and once immediately on connect) to sync DOM to
	 * `state`. Either sync the DOM imperatively (`querySelector`/`textContent`/... and return
	 * nothing), or return an `html` (see `./template/html.js`) tagged-template result describing the
	 * component's full markup - the diffing in `./template/html.js` will patch only what changed
	 * since last time.
	 */
	protected template?(): TemplateResult | void;

	/** lifecycle hook: Called once, right after the first `template()` has been applied to the DOM. */
	protected firstRendered?(): void;

	/** lifecycle hook: Called after every `template()` (including the first) has been applied to the DOM. */
	protected rendered?(): void;

	/** lifecycle hook: Tear down what `connect()` set up (listeners, timers). Runs on every disconnect. */
	protected disconnect?(): void;

	/**
	 * Fine-grained alternative to `template(state)`: a `signal`/`computed`-tracking effect (see
	 * `./signal/`), auto-disposed on disconnect. Prefer this when only a small slice of DOM
	 * needs to react to specific signals, rather than the whole component re-rendering.
	 */
	protected readonly effect = (fn: (onCleanup: OnCleanup) => void): void => {
		this.#effectDisposers.push(createEffect(fn));
	};

	/** Re-runs `template()` when any signal it reads changes; invokes `firstRendered` / `rendered` after each apply. */
	#wireTemplateRenderEffect(): void {
		this.#effectDisposers.push(createEffect(
			() => {
				const result = this.template?.();
				if (result) render(result, this);
			},
			() => {
				if (!this.#firstRenderDone) {
					this.#firstRenderDone = true;
					this.firstRendered?.();
				}
				this.rendered?.();
			},
		));
	}

	// Browser lifecycle entry points — `private` so TS subclasses cannot override; extend `connect` / `disconnect` / `template` / `firstRendered` / `rendered` instead.
	/** Connected to the document (static HTML, parent markup, re-insert after remove). */
	private connectedCallback(): void {
		wireProvidedContextListeners(
			this,
			dispose => this.#effectDisposers.push(dispose),
			dispose => this.#contextListenerDisposers.push(dispose),
		);

		// Runs after the listeners above so descendants appended here(in `connect()`) can `@consume()` synchronously.
		if (!this.#connected) {
			this.#connected = true;
			this.connect?.();
		}

		wireReflectedAttributes(this, dispose => this.#effectDisposers.push(dispose));
		wireConsumedContextFields(this);
		this.#wireTemplateRenderEffect();
	}

	/** Removed from the document; disposes the render effect and any `effect()`s set up in `connect()`. */
	private disconnectedCallback(): void {
		this.disconnect?.();
		this.#connected = false;
		this.#firstRenderDone = false;
		this.#effectDisposers.forEach(dispose => dispose());
		this.#effectDisposers = [];
		this.#contextListenerDisposers.forEach(dispose => dispose());
		this.#contextListenerDisposers = [];
	}

	/**
	 * Attribute → property direction: the browser calls this natively whenever an attribute listed
	 * in `static observedAttributes` (set up by `tag()` from `@attribute()` fields) is set,
	 * changed, or removed - including once per already-present attribute right when a pre-existing
	 * element is upgraded, *before* `connectedCallback`. Parses the new attribute text per the
	 * field's `type` and writes it through the `@attribute()` accessor (`this[def.key] = ...`), which
	 * sets its backing signal - the same signal the property → attribute effect above reads, so
	 * writing back the same (serialized) text is a no-op: `signal.set` only notifies on an actual
	 * value change.
	 */
	private attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
		const def = getAttributeDefs(this.constructor).find(def => def.attribute === name);
		if (!def) return;
		(this as unknown as Record<PropertyKey, unknown>)[def.key] = parseAttribute(newValue, def.converter);
	}
}
