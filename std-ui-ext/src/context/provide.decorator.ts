// `@provide(key)` field decorator (optional sugar): exposes a `state(...)` field of a
// `UIElement` subclass (see `std-ui`) to descendants that `@consume(key)` - the
// "provide" half of this codebase's context protocol. The decorator-free equivalent is
// `defineContext(Class, { provide: { field: key } })`, which feeds the same registry.
//
// It only *registers* `{ field name, key }` in the class's decorator metadata (`./metadata.ts`);
// the field itself is left untouched - it is the store. At connect, `UIElement` reads the store
// back off the instance (`this[name]`) and answers matching `context-request` events with it (see
// `./wire-provide.ts`).

import type { SignalState } from 'std-ui';
import type { ContextKey } from './key.js';
import { providedContexts } from './metadata.js';

/**
 * Field decorator that provides the field's store to descendants through `contextKey`. The field
 * must be a `SignalState<V>` where `V` is the key's value type - anything else is a compile error.
 *
 * ```ts
 * export const ThemeKey = createContextKey<Theme>('theme');
 *
 * class RootPanel extends UIElement {
 *   @provide(ThemeKey) readonly theme = state<Theme>({ mode: 'dark' });
 * }
 *
 * class ChildPanel extends UIElement {
 *   @consume(ThemeKey) readonly theme!: Theme; // reads / reacts to RootPanel's value
 * }
 * ```
 *
 * Plain field only (no `accessor`).
 */
export function provide<V>(contextKey: ContextKey<V>) {
	return function provideDecorator(_value: undefined, ctx: ClassFieldDecoratorContext<object, SignalState<V>>): void {
		if (ctx.kind !== 'field') {
			throw new Error("@provide() can only decorate a plain class field, e.g. `@provide(key) foo = state(0);` (no 'accessor').");
		}
		providedContexts.register(ctx.metadata as object, { key: ctx.name, contextKey: contextKey as ContextKey<unknown> });
	};
}
