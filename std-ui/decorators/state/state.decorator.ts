// `@state()` field decorator: turns a class field on a `UIElement` subclass (see
// `../component.ts`) into a store-backed property (see `./store.ts`) - no attribute involved at
// all. Reading/writing the field reads/writes a reactive store (a `signal()` for a
// primitive/array/class-instance value, or a `SignalState` for a plain-object value - see
// `./store.ts`), so `this.someField` inside `template()`/`effect()` tracks it transparently, the
// same way reading any other signal would.
//
// This is the "just a reactive field" half of what used to be `@property()`'s combined behavior -
// for the attribute-syncing half, see `@attribute()` in `../attribute/attribute.decorator.ts`, which reuses this exact
// field/accessor wiring (via `../field-store.ts`) and layers attribute registration/sync on top.

import type { ContextKey } from '../context/key.js';
import { registerProvidedContextDef } from '../context/metadata.js';
import { applyFieldStore, type FieldDecoratorResult } from '../field-store.js';

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
 *   @state() count = 0; // plain store-backed property
 *   @state() accessor label = 'x'; // `accessor` fields work too
 *   @state() config = { a: 1, b: { c: 2 } }; // plain-object value -> `SignalState`-backed (see
 *     // `./store.ts`): each leaf is independently writable/reactive, and writing
 *     // `this.config = { ...this.config, a: 2 }` only notifies readers of the `a` leaf.
 * }
 * ```
 *
 * Works for both a plain field (`@state() foo = 0;`) and an `accessor` field
 * (`@state() accessor foo = 0;`) - see `../field-store.ts` for why they need different decorator
 * mechanics to end up equivalent.
 *
 * Pass `{ contextKey }` to additionally expose this field to descendants via `@consume()` - see
 * `StateOptions` and `./consume.decorator.ts`:
 *
 * ```ts
 * @state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
 * ```
 */
export function state<T, V>(options: StateOptions<V> = {}) {
	// Overloaded so each call site is checked against the one shape that matches how it's used -
	// `@state() foo = 0` (plain field) vs. `@state() accessor foo = 0` (auto-accessor) - rather than
	// TS trying to reconcile both possible return shapes against a single usage every time.
	function stateDecorator(
		value: undefined,
		context: ClassFieldDecoratorContext<T, V>,
	): ((this: T, value: V) => V) | void;
	function stateDecorator(
		value: ClassAccessorDecoratorTarget<T, V>,
		context: ClassAccessorDecoratorContext<T, V>,
	): ClassAccessorDecoratorResult<T, V>;
	function stateDecorator(
		target: ClassAccessorDecoratorTarget<T, V> | undefined,
		context: ClassAccessorDecoratorContext<T, V> | ClassFieldDecoratorContext<T, V>,
	): FieldDecoratorResult<T, V> {
		if (context.kind !== 'accessor' && context.kind !== 'field') {
			throw new Error("@state() can only decorate class fields (plain or 'accessor'), e.g. `@state() foo = 0;`");
		}
		if (options.contextKey) {
			registerProvidedContextDef(context.metadata as object, {
				key: context.name,
				contextKey: options.contextKey as ContextKey<unknown>,
			});
		}
		return applyFieldStore(target, context);
	}

	return stateDecorator;
}
