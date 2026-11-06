// `@consume()` field decorator: links a class field on a `UIElement` subclass (see
// `../../ui-element.ts`) to a `ContextKey<T>` (`./key.ts`) provided by some ancestor's
// `@state({ contextKey })` field (`../state/state.decorator.ts`) - the "read" half of this codebase's
// context protocol; `@state({ contextKey })` is the "write/provide" half.
//
// Unlike `@state()`/`@attribute()`, this decorator does no storage wiring itself (no
// `applyFieldStore()`) - it only records a `ConsumedContextDef` (`./metadata.ts`). The
// actual live binding (dispatch a `ContextRequestEvent`, find the nearest provider, subscribe to
// its value, redefine the field as a reactive accessor) can only happen once the element is
// connected to a document - the ancestor chain means nothing before then - so it's done by
// `UIElement.connectedCallback()`, in `../../ui-element.ts`, reading these defs back via
// `getConsumedContextDefs()`.
//
// Plain fields only (no `accessor` support): a consumed field has no sensible local initializer
// (its value only ever comes from the provider) and is never locally written, so there's no
// `get`/`set` pair to hand back the way `@state()`'s accessor branch does - `../../ui-element.ts`
// simply `Object.defineProperty`s the field directly onto the instance once connected, the same
// way `../field-store.ts` does for a plain (non-`accessor`) `@state()` field.

import type { ContextKey } from './key.js';
import { registerConsumedContextDef } from './metadata.js';

/**
 * Class field decorator that links the field to a value provided by the nearest ancestor's
 * `@state({ contextKey })` field sharing the same `ContextKey` - reactive, like `@state()`: reading
 * `this.field` inside `template()`/`effect()` re-runs it whenever the provider's value changes.
 * Read-only from the consumer's side - writing throws (the provider owns the value).
 *
 * ```ts
 * export const ThemeKey = createContextKey<Theme>('theme');
 *
 * class RootPanel extends UIElement {
 *   @state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' }; // provides
 * }
 *
 * class ChildPanel extends UIElement {
 *   @consume(ThemeKey) theme!: Theme; // consumes - `V` (`Theme`) is inferred from `ThemeKey`
 * }
 * ```
 *
 * Throws (from `UIElement.connectedCallback()`) if no ancestor currently provides `contextKey`
 * when this element connects - there's no "default value" escape hatch; provide one explicitly
 * further up the tree instead.
 */
export function consume<T, V>(contextKey: ContextKey<V>) {
	return function consumeDecorator(_value: undefined, context: ClassFieldDecoratorContext<T, V>): void {
		if (context.kind !== 'field') {
			throw new Error("@consume() can only decorate a plain class field, e.g. `@consume(someKey) foo!: Foo;` (no 'accessor').");
		}
		// Storage: per-class (keyed off the constructor, inherited via prototype chain of metadata objects).
		registerConsumedContextDef(context.metadata as object, { key: context.name, contextKey: contextKey as ContextKey<unknown> });
	};
}
