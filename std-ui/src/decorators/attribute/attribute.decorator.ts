// `@attribute()` field decorator (optional sugar): marks a `state(...)` field of a `UIElement`
// subclass (see `../ui-element.ts`) as mirrored to/from an HTML attribute via the platform's own
// custom-element "attribute changed" monitoring mechanism (`observedAttributes` +
// `attributeChangedCallback`, wired through `./metadata.ts`), rather than polling or a `MutationObserver`.
//
//   attribute set/changed on the tag  --(attributeChangedCallback, native)-->  store.set(parsed)
//   store set from anywhere in JS     --(effect in UIElement.connectedCallback)-->  setAttribute(serialized)
//
// The field is just the store (`count = state(0)`) - this decorator only *registers* an
// `AttributeDef` (via `createAttributeDef()` in `./metadata.ts`), it never touches the field. It can
// only be applied to a store-typed field. The decorator-free equivalent is
// `defineElement(name, Class, { attributes: { count: options } })` (`../define-element.ts`), which
// registers the very same def.

import { type AttributeConverter, type AttributeType } from './converter.js';
import { attributeDefs, createAttributeDef } from './metadata.js';

export interface AttributeOptions<V = unknown> {
	/**
	 * HTML attribute name mirrored to/from this property. Defaults to the kebab-case of the field
	 * name (`maxCount` -> `max-count`). This is the `attribute` option `@property()` used to have -
	 * now that attribute syncing is its own decorator, there's no `false` case: leave the field
	 * undecorated (a plain `state()`) if it shouldn't touch an attribute at all.
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
	 * property → attribute direction (see `../ui-element.ts`'s `connectedCallback`). Defaults to
	 * `false`: the attribute → property direction (parsing a set/changed attribute
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

/** A store a field can be mirrored through: anything `state()` returns (readable, writable). */
export type AttributeStore = { (): unknown; peek(): unknown; set(value: never): void };

/**
 * Field decorator that registers a `state(...)` field to be mirrored to/from an HTML
 * attribute by `UIElement` (see `../ui-element.ts`): the attribute being set (including by the
 * browser while parsing static markup) parses into `this.field.set(...)`, and - with
 * `reflect: true` - writes to the store are reflected back onto the host attribute.
 *
 * ```ts
 * class MyBadge extends UIElement {
 *   @attribute({ type: Number }) count = state(0); // attribute -> property only (no reflect back)
 *   @attribute({ type: Number, reflect: true }) age = state(0); // also mirrors `age` back
 *   internalOnly = state('x'); // no decorator: store only, no attribute at all
 *   @attribute({ type: Object, reflect: true }) config = state({ a: 1, b: { c: 2 } }); // tree-backed:
 *     // per-leaf reactivity (see `../../signal/state/README.md`); `type: Object`'s default
 *     // converter reflects the object to/from the attribute as JSON text.
 * }
 * ```
 *
 * Applying it to a field that is not a store is a compile error. Plain field only (no `accessor`).
 */
export function attribute(options: AttributeOptions = {}) {
	return function attributeDecorator<S extends AttributeStore>(_value: undefined, context: ClassFieldDecoratorContext<object, S>): void {
		if (context.kind !== 'field') {
			throw new Error("@attribute() can only decorate a plain class field, e.g. `@attribute() foo = state(0);` (no 'accessor').");
		}
		// Registered per class (shared by every instance); if neither `type` nor `converter` was
		// given, the def's converter is inferred from the store's value on first use - see
		// `resolveInferredConverter()` in `./metadata.ts`.
		attributeDefs.register(context.metadata as object, createAttributeDef(context.name, options));
	};
}
