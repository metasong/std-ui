// Lifecycle hooks for `UIElement` (`./ui-element.ts`). Hooks are owned by the class they are
// registered on (stored in its decorator metadata via `ClassRegistry`, inherited by subclasses), so
// an element only runs the hooks of the features it actually uses - no module-level global state
// and no import-time side effects. Type-only import of `UIElement` avoids a circular runtime import.

import type { UIElement } from './ui-element.js';
import { createClassRegistry } from './decorators/class-registry.js';

/** Optional teardown a connect hook returns; runs when the element disconnects. */
export type Cleanup = void | (() => void);

/**
 * Lifecycle callbacks that extensions (decorators, directives, ...) attach to a class via
 * `addClassHooks()` (or to one instance via `UIElement.addHooks()`). To undo something on
 * disconnect, return a cleanup function from `beforeConnect` / `connected`.
 */
export interface UIElementHooks {
	/** Every connect, before `connect()` runs (so descendants added in `connect()` see it). */
	beforeConnect?(el: UIElement): Cleanup;
	/** Every connect, after the one-time `connect()` and before the render effect is wired. */
	connected?(el: UIElement): Cleanup;
	/** Once, after the first `template()` is applied. */
	firstUpdated?(el: UIElement): Cleanup;
	/** After every `template()` is applied. */
	updated?(el: UIElement): void;
	/** An attribute listed in `observedAttributes` was set, changed or removed (native `attributeChangedCallback`). */
	attributeChanged?(el: UIElement, name: string, oldValue: string | null, newValue: string | null): void;
}

const classHookRegistry = createClassRegistry<UIElementHooks>('uiElementHooks');

/**
 * Attaches `hooks` to the class that owns `meta` (`context.metadata` in a decorator,
 * `ownMetadata(ctor)` otherwise). Idempotent: the same hooks object is added at most once per
 * class hierarchy, so a decorator can call it for every decorated field.
 */
export function addClassHooks(meta: object, hooks: UIElementHooks): void {
	if (!classHookRegistry.has(meta, hooks)) classHookRegistry.register(meta, hooks);
}

/** Hooks of `ctor` and its ancestors, most-derived class first. */
export function getClassHooks(ctor: Function): readonly UIElementHooks[] {
	return classHookRegistry.get(ctor);
}
