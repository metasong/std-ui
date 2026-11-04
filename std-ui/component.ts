// Tiny, app-agnostic "component" convention: every UI piece is a native Custom Element that
// reads from some reactive `SignalTree<S>` (see `./signal/tree.js`) and re-renders whenever any
// field it touches changes. No external UI library, no knowledge of any particular app's state
// shape or state singleton - both are supplied by whoever subclasses `UIElement` (see
// `../ui/app-element.ts` for this app's binding, and each file in `ui/components/` for concrete
// components).
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
	type SignalTree,
} from './signal/index.js';
import { render, type TemplateResult } from './template/index.js';

export { property, type PropertyConverter, type PropertyOptions, type PropertyType } from './property/index.js';

/**
 * Class decorator that registers the decorated `UIElement` subclass as a custom element under
 * `tag`. Also wires up `observedAttributes` from any `@property()`-decorated fields (see
 * `./property/`) so the browser calls `attributeChangedCallback` for them - must run before
 * `customElements.define()`, which reads `observedAttributes` once, at definition time.
 */
export function element(tag: string) {
	return function <T extends CustomElementConstructor>(ctor: T, context: ClassDecoratorContext): T {
		defineObservedAttributes(ctor, context);
		customElements.define(tag, ctor);
		return ctor;
	};
}

export abstract class UIElement<S extends object> extends HTMLElement {
	#connected = false;
	#firstRenderDone = false;
	#effectDisposers: Array<() => void> = [];

	/** The reactive state tree this component reads from and re-renders in response to. Supply via a per-app subclass. */
	protected abstract get state(): SignalTree<S>;

	/** lifecycle hook: One-time setup (resolve child nodes, attach listeners, inject any static markup). */
	protected connect?(): void;

	/**
	 * lifecycle hook: Called with the latest state (and once immediately on connect) to sync DOM to
	 * `state`. Either sync the DOM imperatively (`querySelector`/`textContent`/... and return
	 * nothing), or return an `html` (see `./template/html.js`) tagged-template result describing the
	 * component's full markup - the diffing in `./template/html.js` will patch only what changed
	 * since last time.
	 */
	protected template?(state: S): TemplateResult | void;

	/** lifecycle hook: Called once, with the latest state, right after the first `template()` has been applied to the DOM. */
	protected firstRendered?(state: S): void;

	/** lifecycle hook: Called with the latest state after every `template()` (including the first) has been applied to the DOM. */
	protected rendered?(state: S): void;

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

		// `this.state()` is a tracked read of the tree root - a `Computed` that reassembles every
		// leaf into a fresh plain object - so this effect re-runs `template()` whenever any field
		// anywhere in the tree changes (runs once synchronously now, then microtask-batched).
		this.#effectDisposers.push(createEffect(() => {
			const state = this.state();
			const result = this.template?.(state);
			if (result) render(result, this);

			if (!this.#firstRenderDone) {
				this.#firstRenderDone = true;
				this.firstRendered?.(state);
			}
			this.rendered?.(state);
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
	 * in `static observedAttributes` (set up by `element()` from `@property()` fields) is set,
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
