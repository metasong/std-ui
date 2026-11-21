// `UIFeat`: a reusable, composable slice of a `UIElement`'s behavior (a "controller").
//
// A feature is a plain object attached to ONE element instance. It receives the element's lifecycle
// through `UIElement.addHooks()` (see `../ui-element-hooks.ts`), so the host needs no knowledge of
// it: no mixin, no base-class change, no registry on the host. Create it in a field initializer so
// it registers before the element connects and therefore sees every phase.
//
//   class Panel extends UIElement {
//     readonly #hotkeys = new HotkeyFeat(this, { Escape: () => this.close() });
//   }
//
// Reactive state lives in the feature as ordinary `signal`/`state`/`computed` values; a host's
// `template()` that reads them re-renders automatically, so there is no `requestUpdate()`.
//
// Cleanup: whatever `connected()` / `firstUpdated()` returns, and every `this.effect()` started
// while they run, is undone when the host disconnects. Setup therefore re-runs on every reconnect
// and must not rely on state left over from a previous connection.

import type { UIElement } from '../ui-element.js';
import { addClassHooks, type Cleanup } from '../ui-element-hooks.js';
import { effect as createEffect, type OnCleanup } from '../../reactive/index.js';

export abstract class UIFeat<H extends UIElement = UIElement> {
	/** The element this feature is attached to. */
	protected readonly host: H;

	/** Cleanups of effects started inside the lifecycle phase that is currently running. */
	#collector: Array<() => void> | null = null;
	readonly #unregister: () => void;

	constructor(host: H) {
		this.host = host;
		this.#unregister = host.addHooks({
			beforeConnect: () => this.#phase(() => this.beforeConnect?.()),
			connected: () => {
				const teardown = this.#phase(() => this.connected?.());
				return () => {
					teardown();
					this.disconnected?.();
				};
			},
			firstUpdated: () => this.#phase(() => this.firstUpdated?.()),
			updated: () => this.updated?.(),
			attributeChanged: (_el, name, oldValue, newValue) => this.attributeChanged?.(name, oldValue, newValue),
		});
	}

	/**
	 * Class-level attachment: every instance of the class owning `meta` (`context.metadata` in a
	 * decorator) gets its own feature from `create`, made lazily on its first connect. Use it from a
	 * decorator so a feature can be applied declaratively instead of a field initializer.
	 */
	static attachTo<H extends UIElement>(meta: object, create: (host: H) => UIFeat<H>): void {
		const instances = new WeakMap<UIElement, UIFeat<H>>();
		addClassHooks(meta, {
			beforeConnect(el) {
				if (instances.has(el)) return; // already registered itself via `addHooks` on an earlier connect
				const feat = create(el as H);
				instances.set(el, feat);
				// Created mid-`beforeConnect`, so it missed this phase: deliver it by hand.
				return feat.#phase(() => feat.beforeConnect?.());
			},
		});
	}

	/** Every connect, before the host's `connect()` runs. Return a cleanup to run on disconnect. */
	protected beforeConnect?(): Cleanup;
	/** Every connect, after the host's `connect()`. Return a cleanup to run on disconnect. */
	protected connected?(): Cleanup;
	/**
	 * Every host disconnect, after the cleanups from `connected()` and `this.effect()`. For teardown with no
	 * matching setup (flush pending work, reset state); pair add/remove by returning a cleanup instead.
	 */
	protected disconnected?(): void;
	/** Once per connection, after the host's first `template()` is applied. Return a cleanup to run on disconnect. */
	protected firstUpdated?(): Cleanup;
	/** After every `template()` of the host is applied. */
	protected updated?(): void;
	/** An observed attribute of the host changed. */
	protected attributeChanged?(name: string, oldValue: string | null, newValue: string | null): void;

	/**
	 * Tracked effect owned by the host's connection: disposed on disconnect. Only callable from
	 * `beforeConnect` / `connected` / `firstUpdated` (where there is a connection to own it).
	 */
	protected effect(monitoredAction: (onCleanup: OnCleanup) => void, afterAction: (() => void) | null = null): void {
		if (!this.#collector) throw new Error('UIFeat.effect() must be called from beforeConnect/connected/firstUpdated.');
		this.#collector.push(createEffect(monitoredAction, afterAction));
	}

	/** Detaches this feature from the host for good (no more phases are delivered). */
	dispose(): void {
		this.#unregister();
	}

	/** Runs one lifecycle phase, merging its returned cleanup with the effects it started. */
	#phase(run: () => Cleanup): () => void {
		const outer = this.#collector;
		const owned: Array<() => void> = (this.#collector = []);
		let cleanup: Cleanup;
		try {
			cleanup = run();
		} finally {
			this.#collector = outer;
		}
		return () => {
			for (const dispose of owned) dispose();
			cleanup?.();
		};
	}
}
