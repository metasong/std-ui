// `@attribute()` field decorator: turns a class field on a `UIElement` subclass (see
// `../component.ts`) into a store-backed property - exactly like `@state()` (`./state.ts`) - and
// additionally keeps it in sync with an HTML attribute via the platform's own custom-element
// "attribute changed" monitoring mechanism (`observedAttributes` + `attributeChangedCallback`,
// wired through `./metadata.ts`), rather than polling or a `MutationObserver`.
//
//   attribute set/changed on the tag  --(attributeChangedCallback, native)-->  store.set(parsed)
//   store set from anywhere in JS     --(effect in UIElement.connectedCallback)-->  setAttribute(serialized)
//
// `@attribute()` is deliberately "everything `@state()` does, plus attribute registration/sync" -
// it reuses `./field-store.ts`'s exact accessor/plain-field wiring (the same function `@state()`
// calls) instead of duplicating it, and layers `./converter.ts` (attribute<->value conversion) and
// `./metadata.ts` (attribute registration/lookup) on top. `../component.ts` wires the two
// native-facing halves (attribute -> property, property -> attribute) using `./metadata.ts` and
// `./converter.ts`.

import { type AttributeConverter, type AttributeType, inferAttributeType, resolveConverter, toAttributeName } from './converter.js';
import { applyFieldStore, type FieldDecoratorResult } from './field-store.js';
import { type AttributeDef, registerAttributeDef } from './metadata.js';

export interface AttributeOptions<V = unknown> {
	/**
	 * HTML attribute name mirrored to/from this property. Defaults to the kebab-case of the field
	 * name (`maxCount` -> `max-count`). This is the `attribute` option `@property()` used to have -
	 * now that attribute syncing is its own decorator, there's no `false` case: use `@state()`
	 * instead of `@attribute()` for a field that shouldn't touch an attribute at all.
	 */
	name?: string;
	/**
	 * Selects the *default* attribute <-> property converter (ignored if `converter` is also given).
	 * If omitted, it's inferred from the field's own initial value (see `inferAttributeType()` in
	 * `./converter.ts`): a `number` -> `Number`, a `boolean` -> `Boolean`, an array -> `Array`, a
	 * plain object -> `Object`, anything else (including `null`/`undefined`) -> `String`. Pass this
	 * explicitly to override the inferred type. `Object`/`Array` default to JSON
	 * (`JSON.parse`/`JSON.stringify`), matching a complex-object field's store backing.
	 */
	type?: AttributeType;
	/**
	 * Whether writing the property (from JS) also reflects back onto the host attribute - the
	 * property → attribute direction (see `../component.ts`'s `connectedCallback`). Defaults to
	 * `false`, matching `lit`: the attribute → property direction (parsing a set/changed attribute
	 * into the property, via `attributeChangedCallback`) always works; only the opposite direction
	 * needs to be explicitly opted into with `reflect: true`.
	 */
	reflect?: boolean;
	/**
	 * Fully custom attribute <-> property conversion, overriding whatever `type` would otherwise
	 * select. Use this when the five `type` defaults (`String`/`Number`/`Boolean`/`Object`/`Array`)
	 * don't fit - e.g. a `Date`, an enum needing validation, or JSON with a non-empty fallback:
	 *
	 * ```ts
	 * ⁣@attribute({
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
	converter?: AttributeConverter<V>;
}

/**
 * Class field decorator that backs the field with a reactive store - exactly like `@state()`
 * (`./state.ts`), via the shared `applyFieldStore()` - and registers it to be mirrored to/from an
 * HTML attribute by `UIElement` (see `../component.ts`): reading/writing the field reads/writes
 * the store; the store's value is reflected onto the host's attribute; and the attribute being set
 * (including by the browser while parsing static markup) parses back into the store.
 *
 * Works for plain values exactly like `@state()`, and for complex (plain-object) values too - a
 * complex field gets per-leaf reactivity, not just whole-field identity comparison:
 *
 * ```ts
 * class MyBadge extends UIElement {
 *   @attribute({ type: Number }) count = 0; // attribute -> property only (no reflect back)
 *   @attribute({ type: Number, reflect: true }) age = 0; // also mirrors `age` back onto the attribute
 *   @state() internalOnly = 'x'; // store only, no attribute at all - use @state() for this
 *   @attribute({ type: Object, reflect: true }) config = { a: 1, b: { c: 2 } }; // tree-backed:
 *     // a plain-object value becomes a branch of signals/computeds (see `../signal/tree.md`), so
 *     // writing `this.config = { ...this.config, a: 2 }` only notifies readers of the `a` leaf -
 *     // readers depending only on `config.b` don't re-run. `type: Object`'s default converter
 *     // reflects the object to/from the attribute as JSON text; use `@state()` instead if it
 *     // shouldn't touch the attribute at all, or pass a custom `converter` for anything else.
 * }
 * ```
 *
 * See `./field-store.ts` for the accessor/plain-field mechanics this delegates to, and
 * `./design.md` for the full picture.
 */
export function attribute<T, V>(options: AttributeOptions<V> = {}) {
	// Overloaded so each call site is checked against the one shape that matches how it's used -
	// `@attribute() foo = 0` (plain field) vs. `@attribute() accessor foo = 0` (auto-accessor) -
	// rather than TS trying to reconcile both possible return shapes against a single usage every
	// time.
	function attributeDecorator(
		value: undefined,
		context: ClassFieldDecoratorContext<T, V>,
	): ((this: T, value: V) => V) | void;
	function attributeDecorator(
		value: ClassAccessorDecoratorTarget<T, V>,
		context: ClassAccessorDecoratorContext<T, V>,
	): ClassAccessorDecoratorResult<T, V>;
	function attributeDecorator(
		target: ClassAccessorDecoratorTarget<T, V> | undefined,
		context: ClassAccessorDecoratorContext<T, V> | ClassFieldDecoratorContext<T, V>,
	): FieldDecoratorResult<T, V> {
		if (context.kind !== 'accessor' && context.kind !== 'field') {
			throw new Error(
				"@attribute() can only decorate class fields (plain or 'accessor'), e.g. `@attribute() foo = 0;`",
			);
		}

		const key = context.name;
		const attributeName = options.name ?? toAttributeName(key);

		// If neither `type` nor `converter` was given, the real converter can't be picked yet - it
		// depends on the field's initial value, which isn't known until the instance initializes
		// (via `onInitialValue` below). Register a placeholder (`String`) def now, for
		// `observedAttributes`'s sake, and patch `def.converter` in place once the initial value is
		// known - same `def` object, shared by every instance of this class, so the first instance to
		// initialize resolves it for all.
		const needsTypeInference = !options.type && !options.converter;
		const converter = needsTypeInference ? resolveConverter(String, undefined) : resolveConverter(options.type, options.converter);
		const def: AttributeDef = {
			key,
			attribute: attributeName,
			reflect: options.reflect ?? false,
			converter: converter as AttributeConverter,
		};
		// Patches `def.converter` from the real (non-`String`-placeholder) default converter for
		// `initial`'s own runtime type - a no-op once a prior instance has already resolved it.
		function resolveInferredConverter(initial: V): void {
			if (!needsTypeInference) return;
			def.converter = resolveConverter(inferAttributeType(initial), undefined) as AttributeConverter;
		}

		// Registered regardless of whether this decorator's own field-store wiring (below) actually
		// runs or is a no-op (see `applyFieldStore()`'s stacking note in `./field-store.ts`) - the
		// attribute still needs to parse/reflect through whichever store ends up backing the field.
		registerAttributeDef(context.metadata as object, def);
		return applyFieldStore(target, context, resolveInferredConverter);
	}

	return attributeDecorator;
}
