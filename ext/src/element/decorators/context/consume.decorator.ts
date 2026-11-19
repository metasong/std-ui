// `@consume(key)` field decorator (optional sugar; `defineElement(..., { consume })` is the
// decorator-free equivalent): reads the value an ancestor provides under `key` as a plain,
// read-only, reactive property - `this.theme.mode`, not `this.theme().mode`.
//
// It only *registers* `{ field name, key }` in the class's decorator metadata (`./metadata.ts`).
// When an instance connects, `./wire-consume.ts` resolves the nearest provider and defines the
// property on the instance as a getter over a signal it owns.

import type { ContextKey } from './key.js';
import { addClassHooks } from '@std-ui/core';
import { consumedContexts } from './metadata.js';
import { consumeHooks } from './wire-consume.js';

/**
 * Field decorator that exposes the nearest ancestor provider's value (`@provide(key)`), reactively.
 * Declare the field with the key's own value type; it is `undefined` until the element connects, and
 * connecting throws if no ancestor provides the key.
 *
 * ```ts
 * class ThemedButton extends UIElement {
 *   @consume(ThemeKey) readonly theme!: Theme; // this.theme.mode
 * }
 * ```
 *
 * Plain field only (no `accessor`). Needs `useDefineForClassFields`, so the `!:` field isn't erased.
 */
export function consume<V>(contextKey: ContextKey<V>) {
	return function consumeDecorator(_value: undefined, ctx: ClassFieldDecoratorContext<object, V>): void {
		if (ctx.kind !== 'field') {
			throw new Error("@consume() can only decorate a plain class field, e.g. `@consume(key) readonly foo!: Foo;` (no 'accessor').");
		}
		// Storage: per-class (keyed off the constructor, inherited via prototype chain of metadata objects).
		consumedContexts.register(ctx.metadata as object, { key: ctx.name, contextKey: contextKey as ContextKey<unknown> });
		addClassHooks(ctx.metadata as object, consumeHooks);
	};
}
