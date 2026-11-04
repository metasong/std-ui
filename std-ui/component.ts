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
	getPropertyDefs,
	parseAttribute,
	serializeAttribute,
} from './property/index.js';
import {
	effect as createEffect,
	type OnCleanup,
} from './signal/index.js';
import { render, type TemplateResult } from './template/index.js';

export { property, type PropertyConverter, type PropertyOptions, type PropertyType } from './property/index.js';

/**
 * Class decorator that registers the decorated `UIElement` subclass as a custom element under
 * `name`. Also wires up `observedAttributes` from any `@property()`-decorated fields (see
 * `./property/`) so the browser calls `attributeChangedCallback` for them - must run before
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

	// Browser lifecycle entry points — `private` so TS subclasses cannot override; extend `connect` / `disconnect` / `template` / `firstRendered` / `rendered` instead.
	/** Connected to the document (static HTML, parent markup, re-insert after remove). */
	private connectedCallback(): void {
		if (!this.#connected) {
			this.#connected = true;
			this.connect?.();
		}

		// Property → attribute direction: one effect per `@property({ reflect: true })` field,
		// mirroring its signal's value onto the host attribute. Opt-in (defaults to `false`,
		// like `lit`) - plain `@property()` fields only flow attribute → property (see
		// `attributeChangedCallback` below), not back out. Runs once synchronously now (so the
		// attribute matches the property's current/initial value even before any change), then
		// again whenever the property is written from anywhere (JS or the attribute side). Reading
		// `this[def.key]` goes through the `@property()` accessor, which reads its backing signal -
		// an ordinary tracked read, so this effect re-runs exactly like any other signal-driven one.
		for (const def of getPropertyDefs(this.constructor)) {
			if (!def.reflect) continue;
			this.#effectDisposers.push(createEffect(() => {
				const value = (this as unknown as Record<PropertyKey, unknown>)[def.key];
				const serialized = serializeAttribute(value, def.converter);
				if (serialized === null) this.removeAttribute(def.attribute);
				else this.setAttribute(def.attribute, serialized);
			}));
		}

		/// ui updating effect:
		// This effect re-runs `template()` whenever any signal it reads (directly or via nested
		// `signal`/`computed` reads) changes (runs once synchronously now, then microtask-batched).
		this.#effectDisposers.push(createEffect(() => {
			const result = this.template?.(); // if the template read any signal inside the function, the effect will be executed again.
			if (result) render(result, this);

			//todo: these functions below no need to be monitored for this ui effect.(adjust the createEffect function)
			if (!this.#firstRenderDone) {
				this.#firstRenderDone = true;
				this.firstRendered?.();
			}
			this.rendered?.();
		}));
	}

	/** Removed from the document; disposes the render effect and any `effect()`s set up in `connect()`. */
	private disconnectedCallback(): void {
		this.disconnect?.();
		this.#connected = false;
		this.#firstRenderDone = false;
		this.#effectDisposers.forEach(dispose => dispose());
		this.#effectDisposers = [];
	}

	/**
	 * Attribute → property direction: the browser calls this natively whenever an attribute listed
	 * in `static observedAttributes` (set up by `tag()` from `@property()` fields) is set,
	 * changed, or removed - including once per already-present attribute right when a pre-existing
	 * element is upgraded, *before* `connectedCallback`. Parses the new attribute text per the
	 * field's `type` and writes it through the `@property()` accessor (`this[def.key] = ...`), which
	 * sets its backing signal - the same signal the property → attribute effect above reads, so
	 * writing back the same (serialized) text is a no-op: `signal.set` only notifies on an actual
	 * value change.
	 */
	private attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
		const def = getPropertyDefs(this.constructor).find(def => def.attribute === name);
		if (!def) return;
		(this as unknown as Record<PropertyKey, unknown>)[def.key] = parseAttribute(newValue, def.converter);
	}
}
