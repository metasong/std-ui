// Lifecycle hook registry for `UIElement` (`./ui-element.ts`). Kept in its own module (type-only
// import of `UIElement`) so decorators/directives can register themselves without a circular
// runtime import on `ui-element.ts`.

import type { UIElement } from './ui-element.js';

/** Optional teardown a connect hook returns; runs when the element disconnects. */
export type Cleanup = void | (() => void);

/**
 * Lifecycle callbacks that extensions (decorators, directives, ...) register once via
 * `registerUIElementHooks()`; they're invoked for every UIElement instance. To undo something on
 * disconnect, return a cleanup function from `beforeConnect` / `connected`.
 */
export interface UIElementHooks {
	/** Every connect, before `connect()` runs (so descendants added in `connect()` see it). */
	beforeConnect?(el: UIElement): Cleanup;
	/** Every connect, after the one-time `connect()` and before the render effect is wired. */
	connected?(el: UIElement): Cleanup;
	/** Once, after the first `template()` is applied. */
	firstRendered?(el: UIElement): Cleanup;
	/** After every `template()` is applied. */
	rendered?(el: UIElement): void;
}

export const uiElementHooks: UIElementHooks[] = [];

/** Registers lifecycle hooks for all UIElements. Returns an unregister function. */
export function registerUIElementHooks(hooks: UIElementHooks): () => void {
	uiElementHooks.push(hooks);
	return () => {
		const i = uiElementHooks.indexOf(hooks);
		if (i >= 0) uiElementHooks.splice(i, 1);
	};
}
