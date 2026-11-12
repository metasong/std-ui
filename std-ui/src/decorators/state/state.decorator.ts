// `@state()` field decorator: turns a class field on a `UIElement` subclass (see
// `../ui-element.ts`) into a store accessor (see `../field-store.ts`) - no attribute involved at
// all. The field becomes that store (`this.someField()` / `this.someField.set(...)`) — a `signal()`
// for a primitive/array/class-instance value, or a `SignalState` for a plain-object value (see
// `../field-store.ts` and `../../signal/signal-state/README.md`) — so reads inside `template()`/`effect()` track
// it transparently, the same way as
// any other signal.
//
// This is the "just a reactive field" half of what used to be `@property()`'s combined behavior -
// for the attribute-syncing half, see `@attribute()` in `../attribute/attribute.decorator.ts`, which reuses this exact
// field wiring (via `../field-store.ts`) and layers attribute registration/sync on top.

import type { ContextKey } from '../context/key.js';
import { registerProvidedContextDef } from '../context/metadata.js';
import { applyFieldStore } from '../field-store.js';

export interface StateOptions<V = unknown> {
	/**
	 * Exposes this field's store to descendants via `@consume(contextKey)` (`./consume.decorator.ts`)
	 * - the "provide" half of this codebase's context protocol. Any descendant element (through any
	 * number of intermediate elements/shadow roots) with a matching `@consume(contextKey)` field
	 * reads/reacts to this field's value, same as `template()`/`effect()` on this element would.
	 * `V` (the key's phantom type) must match this field's own value type - see `./context/key.ts`.
	 */
	contextKey?: ContextKey<V>;
}

/**
 * Class field decorator that backs the field with a reactive store, with no attribute involved.
 * Use `@attribute()` (`../attribute/attribute.decorator.ts`) instead for a field that should also parse from / reflect
 * to an HTML attribute.
 *
 * ```ts
 * class MyPanel extends UIElement {
 *   @state() count = 0; // `this.count()` / `this.count.set(n)`
 *   @state() config = { a: 1, b: { c: 2 } }; // plain-object value -> `SignalState`-backed (see
 *     // `../field-store.ts` / `../../signal/signal-state/README.md`): each leaf is independently writable/reactive, and
 *     // `this.config.set({ ...this.config.peek(), a: 2 })` only notifies readers of the `a` leaf.
 * }
 * ```
 *
 * Plain field only (no `accessor`) - see `../field-store.ts` for why.
 *
 * Pass `{ contextKey }` to additionally expose this field to descendants via `@consume()` - see
 * `StateOptions` and `./consume.decorator.ts`:
 *
 * ```ts
 * @state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
 * ```
 */
export function state<T, V>(options: StateOptions<V> = {}) {
	return function stateDecorator(_value: undefined, context: ClassFieldDecoratorContext<T, V>): void {
		if (context.kind !== 'field') {
			throw new Error("@state() can only decorate a plain class field, e.g. `@state() foo = 0;` (no 'accessor').");
		}
		if (options.contextKey) {
			registerProvidedContextDef(context.metadata as object, {
				key: context.name,
				contextKey: options.contextKey as ContextKey<unknown>,
			});
		}
		applyFieldStore(context);
	};
}
