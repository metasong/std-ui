// `defineElement(name, Class, options?)`: the decorator-free equivalent of `@tag(name)` plus
// `@attribute()` / `@provide()` / `@consume()` - registers a `UIElement` subclass as a custom element, with
// attributes and context fields declared in typed maps instead of by decorators (see `./README.md`):
//
// ```ts
// class MyBadge extends UIElement {
//   readonly count = signalState(0);
//   readonly label = signalState('hi');
// }
// defineElement('my-badge', MyBadge, { attributes: { count: { type: Number, reflect: true }, label: {} } });
// ```
//
// It feeds the very same registries the decorators do (`../attribute/metadata.ts`, `../context/metadata.ts`), then sets
// `observedAttributes` and calls `customElements.define()`. Run it after the class body so the
// statics (`styles`, `shadowRootOptions`, ...) already exist.

import { ownMetadata } from '../class-registry.js';
import type { AttributeOptions } from '../attribute/attribute.decorator.js';
import type { ContextKey } from '../context/key.js';
import { consumedContexts, providedContexts } from '../context/metadata.js';
import { attributeDefs, createAttributeDef, defineObservedAttributes } from '../attribute/metadata.js';

/** Keys of `I` whose value is a store (readable, writable, peekable) - the fields that can mirror an attribute. */
type StoreKeys<I> = {
	[K in keyof I]: I[K] extends { (): unknown; peek(): unknown; set(value: never): void } ? K : never;
}[keyof I] & string;

/** `attributes` option: field name -> `AttributeOptions`, restricted to the class's store fields. */
export type AttributesMap<I> = { [K in StoreKeys<I>]?: AttributeOptions };

/** `provide` option: store field name -> the `ContextKey` it provides (key value type must match the store's). */
export type ProvideMap<I> = { [K in StoreKeys<I>]?: I[K] extends { peek(): infer V } ? ContextKey<V> : never };

/** `consume` option: field name -> the `ContextKey` it reads (the field is declared with the key's value type). */
export type ConsumeMap<I> = { [K in keyof I & string]?: ContextKey<I[K]> };

export interface DefineElementOptions<I> {
	/** Store fields mirrored to/from HTML attributes - same options as `@attribute()`. */
	attributes?: AttributesMap<I>;
	/** Store fields provided to descendants - same as `@provide(key)`. */
	provide?: ProvideMap<I>;
	/** Fields that read an ancestor's provided value as a plain property - same as `@consume(key)`. */
	consume?: ConsumeMap<I>;
}

/** Registers `ctor` as the custom element `name`, with optional attribute-mirrored store fields. Returns `ctor`. */
export function defineElement<C extends CustomElementConstructor>(
	name: string,
	ctor: C,
	options: DefineElementOptions<InstanceType<C>> = {},
): C {
	const meta = ownMetadata(ctor);
	for (const [key, attributeOptions] of Object.entries(options.attributes ?? {})) {
		attributeDefs.register(meta, createAttributeDef(key, (attributeOptions ?? {}) as AttributeOptions));
	}
	for (const [key, contextKey] of Object.entries(options.provide ?? {})) {
		providedContexts.register(meta, { key, contextKey: contextKey as ContextKey<unknown> });
	}
	for (const [key, contextKey] of Object.entries(options.consume ?? {})) {
		consumedContexts.register(meta, { key, contextKey: contextKey as ContextKey<unknown> });
	}
	defineObservedAttributes(ctor);
	customElements.define(name, ctor);
	return ctor;
}
