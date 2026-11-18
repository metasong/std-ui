// Tiny, app-agnostic "component" convention: every UI piece is a native Custom Element whose
// `template()` reads whatever `signal`/`computed` values it needs directly (see `./signal/`) and
// re-renders whenever any of those it touches changes. No external UI library, no knowledge of
// any particular app's state shape baked into the base class.
//
// Custom elements auto-connect the instant they're inserted into the document - whether that's
// static markup in `index.t` or another component injecting them while assembling its own
// markup. So parents can freely compose child tags without any manual connect ordering/registration
// anywhere.

import {
	attributeDefs,
	parseAttribute,
	resolveInferredConverter,
} from './decorators/index.js';
import { ElementStyles } from './element-styles.js';
import { uiElementHooks, type UIElementHooks } from './ui-element-hooks.js';
import {
	effect as createEffect,
	type OnCleanup,
} from '../reactive/index.js';
import { snapshotLightChildren } from './template/directives/slot/slot-content.js';
import { render, disconnectRendered, type CSSResultGroup, type TemplateResult } from './template/index.js';

export {
	attribute,
	defineElement,
	query,
	queryAll,
	queryAsync,
	queryAssigned,
	queryAssignedNodes,
	queryElement,
	queryElementAsync,
	queryElements,
	tag,
	type AttributeConverter,
	type AttributeOptions,
	type AttributeType,
	type AttributesMap,
	type DefineElementOptions,
} from './decorators/index.js';

export { registerUIElementHooks, type Cleanup, type UIElementHooks } from './ui-element-hooks.js';


export abstract class UIElement extends HTMLElement {
	#connected = false;
	#firstRenderDone = false;
	#effectDisposers: Array<() => void> = [];
	#instanceHooks: UIElementHooks[] = [];
	#renderRoot: Element | DocumentFragment | null = null;
	/**
	 * When set on a subclass, `template()` renders into a shadow root (`attachShadow`) instead of
	 * the host's light DOM. Omit or leave unset for light DOM (default).
	 *
	 * ```ts
	 * @tag('encapsulated-panel')
	 * class Panel extends UIElement {
	 *   static override shadowRootOptions = { mode: 'open' } as const;
	 * }
	 * ```
	 */
	static shadowRootOptions?: ShadowRootInit;

	/**
	 * Styles shared by every instance of this class, written with `css` (see `./template/tag-funcs/css/index.ts`) -
	 * is a static `styles` field. `:host` selects the component root either way (the shadow
	 * host, or - rewritten to `:scope` under the hood - the matched custom element in light DOM).
	 *
	 * - Shadow root (`static shadowRootOptions` set): adopted via `adoptedStyleSheets` - cheap,
	 *   shared by reference across instances, and naturally scoped by the shadow boundary.
	 * - Light DOM (default): adopted once per *custom element tag* (not per instance - every
	 *   instance of a class shares one sheet) wrapped in `@scope (tag-name) { ... }`, so it only
	 *   matches this tag's own elements - never bleeds into unrelated markup - without the cost of
	 *   re-parsing identical CSS text per instance that a per-instance `<style>` would mean.
	 *
	 * ```ts
	 * @tag('themed-panel')
	 * class Panel extends UIElement {
	 *   static override shadowRootOptions = { mode: 'open' } as const;
	 *   static override styles = css`:host { display: block; } button { color: red; }`;
	 * }
	 * ```
	 */
	static styles?: CSSResultGroup;

	/**
	 * Registers lifecycle hooks for this element instance only (global ones come from
	 * `registerUIElementHooks()`). Call before connect to receive every phase. Returns an unregister function.
	 */
	addHooks(hooks: UIElementHooks): () => void {
		this.#instanceHooks.push(hooks);
		return () => {
			const i = this.#instanceHooks.indexOf(hooks);
			if (i >= 0) this.#instanceHooks.splice(i, 1);
		};
	}

	/** Where `template()` is rendered — the host element (light DOM) or `shadowRoot`. */
	get renderRoot(): Element | DocumentFragment {
		return this.#renderRoot ?? this.#ensureRenderRoot();
	}

	/** Creates the DOM container for `template()`. Default: shadow root when `shadowRootOptions` is set, else `this`. */
	protected createRenderRoot(): Element | DocumentFragment {
		const opts = (this.constructor as typeof UIElement).shadowRootOptions;
		if (opts) return this.attachShadow(opts);
		return this;
	}

	/** Applies/tracks `static styles` for this instance's render root - see `./element-styles.ts`. */
	readonly #elementStyles = new ElementStyles();

	#ensureRenderRoot(): Element | DocumentFragment {
		if (this.#renderRoot === null) {
			this.#renderRoot = this.createRenderRoot();
			// Light DOM: remember the parent-authored children (no DOM change) for `slot()`.
			if (this.#renderRoot === this) snapshotLightChildren(this);
			this.#elementStyles.apply(
				this.#renderRoot,
				this.tagName.toLowerCase(),
				(this.constructor as typeof UIElement).styles,
			);
		}
		return this.#renderRoot;
	}

	/**
	 * Resolves once any render/effect re-run currently pending (microtask-batched, see
	 * `./reactive/effect/main.ts`) has run - i.e. the DOM reflects every signal write made so far.
	 * Used by `@queryAsync()` (`./decorators/query/query-async.decorator.ts`) so a query issued right after
	 * writing a signal sees the DOM that write produces, not the stale DOM from before it.
	 */
	public get updateComplete(): Promise<true> {
		return new Promise(resolve => {
			// Two microtask hops: the first lets the pending effect flush (`scheduleFlush()` in
			// `./reactive/effect/main.ts` queues exactly one microtask); the second runs after that,
			// guaranteeing the flush has already executed by the time we resolve.
			queueMicrotask(() => queueMicrotask(() => resolve(true)));
		});
	}

	/** lifecycle hook: occur when the element is connected to the document.
	 *  This is a one-time setup (resolve child nodes, attach listeners, inject any static markup).
	 *  The most common of these is adding event listeners to nodes external to the element, like a keydown event handler added to the window.
	 *  Typically, anything done in connect() should be undone when the element is disconnect
	*/
	protected connect?(): void;

	/**
	 * lifecycle hook: Called with the latest state (and once immediately on connect) to sync DOM to
	 * `state`. Either sync the DOM imperatively (`querySelector`/`textContent`/... and return
	 * nothing), or return an `t` (see `./template/tag-funcs/html/index.js`) tagged-template result describing the
	 * component's full markup - the diffing in `./template/tag-funcs/html/index.js` will patch only what changed
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
			this.#requestUpdate.bind(this),
			() => {
				this.#elementStyles.reinsertIfRemoved(this.#renderRoot!);
				if (!this.#firstRenderDone) {
					this.#firstRenderDone = true;
					this.firstRendered?.();
					this.#runCleanupHooks('firstRendered');
				}
				this.rendered?.();
				for (const h of [...uiElementHooks, ...this.#instanceHooks]) h.rendered?.(this);
			},
		));
	}

	/**
	 * The render effect body: runs `template()` and renders it. Private; Not a public API.
	 * `requestUpdate()`. To re-render, write a signal - see `doc/why-no-request-update.md`.
	 */
	#requestUpdate() {
		const result = this.template?.();
		if (result) render(result, this.renderRoot, { host: this });
	}

	// Browser lifecycle entry points — `private` so TS subclasses cannot override; extend `connect` / `disconnect` / `template` / `firstRendered` / `rendered` instead.
	/** Connected to the document (static HTML, parent markup, re-insert after remove). */
	private connectedCallback(): void {
		this.#runCleanupHooks('beforeConnect');

		// Runs after the hooks above so descendants appended here (in `connect()`) can consume synchronously.
		if (!this.#connected) {
			this.#connected = true;
			this.#ensureRenderRoot();
			this.connect?.();
		}

		this.#runCleanupHooks('connected');
		this.#wireTemplateRenderEffect();
	}

	/** Runs a cleanup-returning hook phase on every registered extension; returned cleanups run on disconnect. */
	#runCleanupHooks(phase: 'beforeConnect' | 'connected' | 'firstRendered'): void {
		for (const hooks of [...uiElementHooks, ...this.#instanceHooks]) {
			const cleanup = hooks[phase]?.(this);
			if (cleanup) this.#effectDisposers.push(cleanup);
		}
	}

	/** Removed from the document; disposes the render effect and any `effect()`s set up in `connect()`. */
	private disconnectedCallback(): void {
		this.disconnect?.();
		// Runs bound directives' `disconnected()`; DOM is kept, directives are re-created on reconnect.
		if (this.#renderRoot) disconnectRendered(this.#renderRoot);
		this.#connected = false;
		this.#firstRenderDone = false;
		this.#effectDisposers.forEach(dispose => dispose());
		this.#effectDisposers = [];
	}

	/**
	 * Attribute → property direction: the browser calls this natively whenever an attribute listed
	 * in `static observedAttributes` (set up by `tag()` from `@attribute()` fields) is set,
	 * changed, or removed - including once per already-present attribute right when a pre-existing
	 * element is upgraded, *before* `connectedCallback`. Parses the new attribute text per the
	 * field's `type` and writes `this[def.key].set(parsed)` on the field's backing store — the same
	 * store the property → attribute effect above reads via `this[def.key]()` — so
	 * writing back the same (serialized) text is a no-op: `signal.set` only notifies on an actual
	 * value change.
	 */
	private attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
		const def = attributeDefs.get(this.constructor).find(def => def.attribute === name);
		if (!def) return;

		resolveInferredConverter(this, def);
		const parsed = parseAttribute(newValue, oldValue, def.converter);
		if (parsed === undefined) return; // a converter's `fromAttribute` returning `undefined` means "leave untouched"
		(this as unknown as Record<PropertyKey, { set(value: unknown): void }>)[def.key].set(parsed);
	}
}
