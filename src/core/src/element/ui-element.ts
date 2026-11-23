// Tiny, app-agnostic "component" convention: every UI piece is a native Custom Element whose
// `template()` reads whatever `signal`/`computed` values it needs directly (see `./signal/`) and
// re-renders whenever any of those it touches changes. No external UI library, no knowledge of
// any particular app's state shape baked into the base class.
//
// Custom elements auto-connect the instant they're inserted into the document - whether that's
// static markup in `index.t` or another component injecting them while assembling its own
// markup. So parents can freely compose child tags without any manual connect ordering/registration
// anywhere.

import { ElementStyles } from './element-styles.js';
import { getClassHooks, HookPhase, type UIElementHooks } from './ui-element-hooks.js';
import {
	effect as createEffect,
	type OnCleanup,
} from '../reactive/index.js';
import { whenFlushed } from '../reactive/effect/index.js';
import { render, disconnectRendered, type CSSResultGroup, type TemplateResult } from './template/index.js';

export {
	attribute,
	defineElement,
	query,
	queryAll,
	queryAsync,
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

export { addClassHooks, type Cleanup, type UIElementHooks } from './ui-element-hooks.js';


export abstract class UIElement extends HTMLElement {
	#connected = false;
	/** True once `beforeConnect`/`connected` hooks of the current connection have run (late `addHooks()` catch up). */
	#hooksSettled = false;
	#firstUpdateDone = false;
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
	 * Styles shared by every instance of this class, written with the `css` tag (see
	 * `./template/tag-funcs/css/index.ts`) and assigned to this static `styles` field. `:host` selects the component root either way (the shadow
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
	 * Registers lifecycle hooks for this element instance only (class-level ones come from
	 * `addClassHooks()`). Hooks added after connect catch up on `beforeConnect`/`connected` (and `firstUpdated` if it already ran). Returns an unregister function.
	 */
	addHooks(hooks: UIElementHooks): () => void {
		this.#instanceHooks.push(hooks);
		// Added while already connected: catch up on the phases that already ran (their cleanups run on disconnect).
		if (this.#hooksSettled) {
			for (const phase of [HookPhase.beforeConnect, HookPhase.connected, ...(this.#firstUpdateDone ? [HookPhase.firstUpdated] as const : [])]) {
				const cleanup = hooks[phase]?.(this);
				if (cleanup) this.#effectDisposers.push(cleanup);
			}
		}
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
			this.#elementStyles.apply(
				this.#renderRoot,
				this.tagName.toLowerCase(),
				(this.constructor as typeof UIElement).styles,
			);
		}
		return this.#renderRoot;
	}

	/**
	 * Resolves once every render/effect re-run pending after the call - including re-runs that
	 * those cause in turn (an effect writing a signal another effect reads) - has run, i.e. the DOM
	 * reflects every signal write made so far. Resolves also for an element that isn't connected.
	 * Used by `@queryAsync()` (`./decorators/query/query-async.decorator.ts`) so a query issued right after
	 * writing a signal sees the DOM that write produces, not the stale DOM from before it.
	 */
	public get updateComplete(): Promise<true> {
		return new Promise(resolve => {
			// One microtask hop first, so a write made later in the same synchronous turn (after this
			// read, before `await`) has already scheduled its flush when we ask whether one is pending;
			// then wait for the effect queue to go fully idle (`whenFlushed`, see
			// `./reactive/effect/main.ts`), which covers cascades of any depth.
			queueMicrotask(() => whenFlushed().then(() => resolve(true)));
		});
	}

	/** lifecycle hook: runs each time the element is connected to the document (again after a
	 *  disconnect and re-insert), before the first `template()` of that connection.
	 *  Use it for per-connection setup (resolve child nodes, attach listeners, inject static markup).
	 *  The most common case is adding listeners to nodes outside the element, like a `keydown`
	 *  handler on `window`. Anything done here should be undone in `disconnect()`, since `connect()`
	 *  runs again on reconnect.
	 */
	protected connect?(): void;

	/**
	 * lifecycle hook: Called once immediately on connect, then again whenever any signal it reads
	 * changes, to sync the DOM with those signals. Either sync the DOM imperatively
	 * (`querySelector`/`textContent`/... and return nothing), or return a `t` tagged-template result
	 * (see `./template/tag-funcs/html/index.js`) describing the component's markup - only the values
	 * that changed since the last render are patched.
	 */
	protected template?(): TemplateResult | void;

	/** lifecycle hook: Called right after the first `template()` of each connection has been applied to
	 *  the DOM. It runs again after a disconnect and reconnect, because the render effect is recreated. */
	protected firstUpdated?(): void;

	/** lifecycle hook: Called after every `template()` (including the first) has been applied to the DOM. */
	protected updated?(): void;

	/** lifecycle hook: Tear down what `connect()` set up (listeners, timers). Runs on every disconnect. */
	protected disconnect?(): void;

	/**
	 * Fine-grained alternative to `template(state)`: a `signal`/`computed`-tracking effect (see
	 * `./signal/`), auto-disposed on disconnect. Prefer this when only a small slice of DOM
	 * needs to react to specific signals, rather than the whole component re-rendering.
	 *
	 * @example
	 * this.effect((onCleanup) => {
	 *   const id = setInterval(() => this.#now.set(Date.now()), 1000);
	 *   onCleanup(() => clearInterval(id));
	 * }, () => this.#label.dataset.ticked = '1'); // afterAction: untracked, runs after each run
	 *
	 * @param monitoredAction - The tracked effect body, run immediately and re-run whenever a signal it
	 * reads changes. Receives `onCleanup` to register cleanup functions that run before the next
	 * re-run and on disconnect. The body is dependency-tracked, but the registered cleanup functions
	 * run untracked, so signals read inside them do not become dependencies.
	 * @param afterAction - Optional callback run right after `monitoredAction` on every run. Untracked,
	 * so signals it reads won't trigger re-runs. Defaults to `null`.
	 */
	protected readonly effect = (
		monitoredAction: (onCleanup: OnCleanup) => void,
		afterAction: (() => void) | null = null,
	): void => {
		this.#effectDisposers.push(createEffect(monitoredAction, afterAction));
	};

	/** Re-runs `template()` when any signal it reads changes; invokes `firstUpdated` / `updated` after each apply. */
	#wireTemplateUpdateEffect(): void {
		this.#effectDisposers.push(createEffect(
			this.#requestUpdate.bind(this),
			() => {
				this.#elementStyles.reinsertIfRemoved(this.#renderRoot!);
				if (!this.#firstUpdateDone) {
					// Snapshot before `firstUpdated()`: a hook added from inside it is caught up by
					// `addHooks()` (the flag below is already set), so it must not also be in this run.
					const hooks = this.#allHooks();
					this.#firstUpdateDone = true;
					this.firstUpdated?.();
					this.#runCleanupHooks(HookPhase.firstUpdated, hooks);
				}
				this.updated?.();
				this.#runHooks(HookPhase.updated);
			},
		));
	}

	/**
	 * The render effect body: runs `template()` and renders it. Private, not a public API: there is
	 * deliberately no `requestUpdate()`. To re-render, write a signal - see `doc/why-no-request-update.md`.
	 */
	#requestUpdate() {
		const result = this.template?.();
		if (result) render(result, this.renderRoot, { host: this });
	}

	// Browser lifecycle entry points — `private` so TS subclasses cannot override; extend `connect` / `disconnect` / `template` / `firstUpdated` / `updated` instead.
	/** Connected to the document (static HTML, parent markup, re-insert after remove). */
	private connectedCallback(): void {
		this.#runCleanupHooks(HookPhase.beforeConnect);

		// Runs after the hooks above so descendants appended here (in `connect()`) can consume synchronously.
		if (!this.#connected) {
			this.#connected = true;
			this.#ensureRenderRoot();
			this.connect?.();
		}
		// User code above may have removed us; the browser then ran `disconnectedCallback` synchronously
		// (nested), which already tore everything down. Wiring anything now would leak it.
		if (!this.isConnected) return;

		// Settled *before* the `connected` phase: a hook added from inside a `connected` hook is not in
		// that phase's snapshot, so `addHooks()` must catch it up (beforeConnect + connected) itself.
		this.#hooksSettled = true;
		this.#runCleanupHooks(HookPhase.connected);
		if (!this.isConnected) {
			// A `connected` hook removed us. Its (and later hooks') cleanups were registered after the nested
			// `disconnectedCallback` had already run its teardown, so run them now.
			this.#disposeEffects();
			return;
		}
		this.#wireTemplateUpdateEffect();
	}

	/** Runs and forgets every registered effect/hook cleanup. */
	#disposeEffects(): void {
		const disposers = this.#effectDisposers;
		this.#effectDisposers = [];
		disposers.forEach(dispose => dispose());
	}

	/** Class-level hooks (inherited) followed by this instance's own; a fresh array, safe against mid-iteration changes. */
	#allHooks(): UIElementHooks[] {
		return [...getClassHooks(this.constructor), ...this.#instanceHooks];
	}

	/** Runs a fire-and-forget hook phase (no cleanup) on every registered extension. */
	#runHooks(phase: typeof HookPhase.updated): void;
	#runHooks(phase: typeof HookPhase.attributeChanged, name: string, oldValue: string | null, newValue: string | null): void;
	#runHooks(phase: typeof HookPhase.updated | typeof HookPhase.attributeChanged, ...args: [string, string | null, string | null] | []): void {
		for (const hooks of this.#allHooks()) {
			if (phase === HookPhase.updated) hooks.updated?.(this);
			else hooks.attributeChanged?.(this, ...(args as [string, string | null, string | null]));
		}
	}

	/** Runs a cleanup-returning hook phase on every registered extension; returned cleanups run on disconnect. */
	#runCleanupHooks(
		phase: typeof HookPhase.beforeConnect | typeof HookPhase.connected | typeof HookPhase.firstUpdated,
		registered: readonly UIElementHooks[] = this.#allHooks(),
	): void {
		for (const hooks of registered) {
			const cleanup = hooks[phase]?.(this);
			if (cleanup) this.#effectDisposers.push(cleanup);
		}
	}

	/** Removed from the document; disposes the render effect and any `effect()`s set up in `connect()`. */
	private disconnectedCallback(): void {
		// Teardown mirrors setup in reverse: stop reactivity first, so nothing the steps below do
		// (e.g. a `disconnect()` that writes a signal) can schedule a render on a half-torn-down element.
		this.#connected = false;
		this.#hooksSettled = false;
		this.#firstUpdateDone = false;
		this.#disposeEffects();
		this.disconnect?.();
		// Runs bound directives' `disconnected()`; DOM is kept, directives are re-created on reconnect.
		if (this.#renderRoot) disconnectRendered(this.#renderRoot);
	}

	/**
	 * The browser calls this natively whenever an attribute listed in `static observedAttributes`
	 * (set up by `tag()` from `@attribute()` fields) is set, changed, or removed - including once
	 * per already-present attribute when a pre-existing element is upgraded, *before*
	 * `connectedCallback`. This class only forwards it to the `attributeChanged` hooks; the
	 * attribute → property parsing lives in the `@attribute()` hooks (see
	 * `./decorators/attribute/`), which write the parsed value into the field's signal. Writing the
	 * same value back is a no-op, since `signal.set` only notifies on an actual change.
	 */
	private attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
		this.#runHooks(HookPhase.attributeChanged, name, oldValue, newValue);
	}
}
