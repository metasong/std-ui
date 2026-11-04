// `@property()` field decorator: turns a class field on a `UIElement` subclass (see
// `../component.ts`) into a store-backed property (see `./store.ts`) that is kept in sync with an
// HTML attribute via the platform's own custom-element "attribute changed" monitoring mechanism
// (`observedAttributes` + `attributeChangedCallback`, wired through `./metadata.ts`), rather than
// polling or a `MutationObserver`.
//
//   attribute set/changed on the tag  --(attributeChangedCallback, native)-->  store.set(parsed)
//   store set from anywhere in JS     --(effect in UIElement.connectedCallback)-->  setAttribute(serialized)
//
// This file only knows about decorating fields and registering their defs; `./converter.ts` owns
// attribute<->value conversion, `./metadata.ts` owns registration/lookup, `./store.ts` owns the
// backing store, and `../component.ts` wires the two native-facing halves using all of the above.

import { inferPropertyType, type PropertyConverter, type PropertyType, resolveConverter, toAttributeName } from './converter.js';
import { type PropertyDef, registerPropertyDef } from './metadata.js';
import { createStore } from './store.js';

export interface PropertyOptions<V = unknown> {
	/**
	 * HTML attribute name mirrored to/from this property. Defaults to the kebab-case of the field
	 * name (`maxCount` -> `max-count`). Pass `false` to make this a plain store-backed property
	 * with no attribute reflection at all.
	 */
	attribute?: string | false;
	/**
	 * Selects the *default* attribute <-> property converter (ignored if `converter` is also given).
	 * If omitted, it's inferred from the field's own initial value (see `inferPropertyType()` in
	 * `./converter.ts`): a `number` -> `Number`, a `boolean` -> `Boolean`, an array -> `Array`, a
	 * plain object -> `Object`, anything else (including `null`/`undefined`) -> `String`. Pass this
	 * explicitly to override the inferred type. `Object`/`Array` default to JSON
	 * (`JSON.parse`/`JSON.stringify`), matching a complex-object field's store backing (see
	 * `property()`'s doc comment).
	 */
	type?: PropertyType;
	/**
	 * Whether writing the property (from JS) also reflects back onto the host attribute - the
	 * property → attribute direction (see `../component.ts`'s `connectedCallback`). Defaults to
	 * `false`, matching `lit`: the attribute → property direction (parsing a set/changed attribute
	 * into the property, via `attributeChangedCallback`) always works as long as `attribute` isn't
	 * `false`; only the opposite direction needs to be explicitly opted into with `reflect: true`.
	 */
	reflect?: boolean;
	/**
	 * Fully custom attribute <-> property conversion, overriding whatever `type` would otherwise
	 * select. Use this when the five `type` defaults (`String`/`Number`/`Boolean`/`Object`/`Array`)
	 * don't fit - e.g. a `Date`, an enum needing validation, or JSON with a non-empty fallback:
	 *
	 * ```ts
	 * ⁣@property({
	 *   type: Object,
	 *   reflect: true,
	 *   converter: {
	 *     fromAttribute: (value) => {
	 *       try { return value ? JSON.parse(value) : {}; } catch { return {}; }
	 *     },
	 *     toAttribute: (value) => (value ? JSON.stringify(value) : ''),
	 *   },
	 * })
	 * config = { theme: 'dark' };
	 * ```
	 */
	converter?: PropertyConverter<V>;
}

/**
 * Class field decorator that backs the field with a reactive store (via `createStore()`, see
 * `./store.ts`) and, unless `attribute: false`, registers it to be mirrored to/from an HTML
 * attribute by `UIElement` (see `../component.ts`): reading/writing the field reads/writes the
 * store; the store's value is reflected onto the host's attribute; and the attribute being set
 * (including by the browser while parsing static markup) parses back into the store.
 *
 * Works for plain values exactly like before, and for complex (plain-object) values too - a
 * complex field gets per-leaf reactivity, not just whole-field identity comparison:
 *
 * ```ts
 * class MyBadge extends UIElement<State> {
 *   @property({ type: Number }) count = 0; // attribute -> property only (no reflect back)
 *   @property({ type: Number, reflect: true }) age = 0; // also mirrors `age` back onto the attribute
 *   @property({ attribute: false }) internalOnly = 'x'; // store only, no attribute
 *   @property({ type: Object, reflect: true }) config = { a: 1, b: { c: 2 } }; // tree-backed:
 *     // a plain-object value becomes a branch of signals/computeds (see `../signal/tree.md`), so
 *     // writing `this.config = { ...this.config, a: 2 }` only notifies readers of the `a` leaf -
 *     // readers depending only on `config.b` don't re-run. `type: Object`'s default converter
 *     // reflects the object to/from the attribute as JSON text; pass `attribute: false` instead if
 *     // it shouldn't touch the attribute at all, or a custom `converter` for anything else.
 * }
 * ```
 *
 * A plain field can't delegate through a prototype `get`/`set` the way an `accessor` field can -
 * field initializers always `[[DefineOwnProperty]]` straight onto the instance, bypassing any
 * inherited/decorator-installed accessor (this is exactly the shadowing problem the `accessor`
 * keyword exists to solve). So instead of trying to intercept the field's own initializer, this
 * decorator lets the field initialize normally (`this.key = initialValue`, an ordinary own data
 * property) and then - via `context.addInitializer`, which per spec runs with `this` bound to the
 * instance right at that field's position in the constructor, immediately after it's set - replaces
 * that *same* own property with a `get`/`set` pair backed by `createStore(initialValue)`. By the
 * time any other code (including later field initializers, `connect()`, etc.) can observe
 * `this.key`, it is already store-backed - functionally identical to what the `accessor` keyword
 * gives for free, just assembled by hand with `Object.defineProperty` instead of the auto-accessor
 * machinery.
 *
 * `accessor` fields are still accepted too (`@property() accessor foo = 0`), using the native
 * auto-accessor storage slot directly instead of this `Object.defineProperty` step.
 *
 * See `./design.md` for the full accessor/plain-field mechanics and why the naive alternative
 * (installing the accessor on the prototype once, from the class decorator) doesn't work.
 */
export function property<T, V>(options: PropertyOptions<V> = {}) {
	// Overloaded so each call site is checked against the one shape that matches how it's used -
	// `@property() foo = 0` (plain field) vs. `@property() accessor foo = 0` (auto-accessor) - rather
	// than TS trying to reconcile both possible return shapes against a single usage every time.
	function propertyDecorator(
		value: undefined,
		context: ClassFieldDecoratorContext<T, V>,
	): ((this: T, value: V) => V) | void;
	function propertyDecorator(
		value: ClassAccessorDecoratorTarget<T, V>,
		context: ClassAccessorDecoratorContext<T, V>,
	): ClassAccessorDecoratorResult<T, V>;
	function propertyDecorator(
		target: ClassAccessorDecoratorTarget<T, V> | undefined,
		context: ClassAccessorDecoratorContext<T, V> | ClassFieldDecoratorContext<T, V>,
	): ClassAccessorDecoratorResult<T, V> | ((this: T, value: V) => V) | void {
		if (context.kind !== 'accessor' && context.kind !== 'field') {
			throw new Error(
				"@property() can only decorate class fields (plain or 'accessor'), e.g. `@property() foo = 0;`",
			);
		}

		const key = context.name;
		const attribute = options.attribute === false ? null : (options.attribute ?? toAttributeName(key));

		// If neither `type` nor `converter` was given, the real converter can't be picked yet - it
		// depends on the field's initial value, which isn't known until the instance initializes
		// (below). Register a placeholder (`String`) def now, for `observedAttributes`'s sake, and
		// patch `def.converter` in place once the initial value is known - same `def` object, shared
		// by every instance of this class, so the first instance to initialize resolves it for all.
		let def: PropertyDef | undefined;
		const needsTypeInference = !options.type && !options.converter;

		if (attribute) {
			const converter = needsTypeInference ? resolveConverter(String, undefined) : resolveConverter(options.type, options.converter);
			def = {
				key,
				attribute,
				reflect: options.reflect ?? false,
				converter: converter as PropertyConverter,
			};
			registerPropertyDef(context.metadata as object, def);
		}

		// Patches `def.converter` from the real (non-`String`-placeholder) default converter for
		// `initial`'s own runtime type - a no-op once a prior instance has already resolved it.
		function resolveInferredConverter(initial: V): void {
			if (!def || !needsTypeInference) return;
			def.converter = resolveConverter(inferPropertyType(initial), undefined) as PropertyConverter;
		}

		if (context.kind === 'accessor') {
			const accessorTarget = target as ClassAccessorDecoratorTarget<T, V>;
			// `accessor` fields come with their own private per-instance storage slot already (that's
			// what `target.get`/`target.set` read/write) - no separate `WeakMap`/`Map` side table needed.
			// We just store the backing store in that slot instead of the raw value: `init()` runs once
			// per instance, wrapping the field's initializer value; `get`/`set` then read/write *through*
			// that store rather than returning/replacing it. `component.ts` reaches a given property's
			// current value the same way any caller would - `instance[key]` - so an `effect()` reading
			// `this.someProp` tracks the underlying store transparently, no extra lookup helper required.
			return {
				get(this: T): V {
					const store = accessorTarget.get.call(this) as unknown as { (): V };
					return store();
				},
				set(this: T, value: V): void {
					if (value === undefined) return; // a converter's `fromAttribute` returning `undefined` means "leave untouched"
					const store = accessorTarget.get.call(this) as unknown as { set(value: V): void };
					store.set(value);
				},
				init(this: T, value: V): V {
					resolveInferredConverter(value);
					return createStore(value) as unknown as V;
				},
			};
		}

		// Plain field: let the default initializer run (own data property, initial value unchanged),
		// then immediately redefine that same own property as a store-backed accessor - see the
		// doc comment above for why this has to happen *after* the field's own initialization rather
		// than trying to replace it.
		context.addInitializer(function (this: T): void {
			const initial = (this as unknown as Record<PropertyKey, V>)[key];
			resolveInferredConverter(initial);
			const store = createStore(initial);
			Object.defineProperty(this, key, {
				get(): V {
					return store();
				},
				set(value: V): void {
					if (value === undefined) return; // a converter's `fromAttribute` returning `undefined` means "leave untouched"
					store.set(value as never);
				},
				enumerable: true,
				configurable: true,
			});
		});
	}

	return propertyDecorator;
}
