// `@attribute()` / `defineElement({ attributes })` registration bookkeeping: one `AttributeDef` per
// attribute-backed field, kept per class in a shared `ClassRegistry` (`../class-registry.ts`; `defineElement` writes to
// the class's own metadata object). Fields that are not decorated never register here.

import { type AttributeConverter, type AttributeType, inferAttributeType, resolveConverter, toAttributeName } from './converter.js';
import { createClassRegistry } from '../class-registry.js';

/**
 * One attribute-backed field, recorded either by `@attribute()` (in a class's `context.metadata` /
 * `[Symbol.metadata]`) or by `defineElement(..., { attributes })` (into the class's own metadata, see `ownMetadata()`).
 */
export interface AttributeDef {
	key: PropertyKey;
	attribute: string;
	reflect: boolean;
	converter: AttributeConverter;
	/**
	 * `true` while `converter` is only a placeholder: neither `type` nor `converter` was given, so the
	 * real one is inferred from the field's store value the first time an instance needs it (see
	 * `resolveInferredConverter()`).
	 */
	infer?: boolean;
}

/** Every attribute-backed field of a class: `.get(ctor)`, `.register(meta, def)`. */
export const attributeDefs = createClassRegistry<AttributeDef>('attributeDefs');

/** A `stateTree()` store: callable, with `peek()` and `set()`. Any other field value is treated as a plain value. */
export type SignalLikeForAttribute = { (): unknown; peek(): unknown; set(value: never): void };

export function isSignalLikeForAttribute(value: unknown): value is SignalLikeForAttribute {
	return (
		typeof value === 'function' &&
		typeof (value as { peek?: unknown }).peek === 'function' &&
		typeof (value as { set?: unknown }).set === 'function'
	);
}

/**
 * Resolves a still-placeholder converter from `host`'s field value (the store's `peek()`, or the plain value) - a
 * no-op once resolved. The def is shared by every instance, so the first one to call this resolves it for all.
 */
export function resolveInferredConverter(host: object, def: AttributeDef): void {
	if (!def.infer) return;
	const field = (host as Record<PropertyKey, unknown>)[def.key];
	def.converter = resolveConverter(inferAttributeType(isSignalLikeForAttribute(field) ? field.peek() : field), undefined) as AttributeConverter;
	def.infer = false;
}

/**
 * Builds the `AttributeDef` for field `key` from `options` - the one place that turns
 * `AttributeOptions` into a def, shared by `@attribute()` and `defineElement()`.
 */
export function createAttributeDef(key: PropertyKey, options: AttributeDefOptions): AttributeDef {
	const infer = !options.type && !options.converter;
	return {
		key,
		attribute: options.name ?? toAttributeName(key),
		reflect: options.reflect ?? false,
		converter: (infer ? resolveConverter(String, undefined) : resolveConverter(options.type, options.converter)) as AttributeConverter,
		infer,
	};
}

/** The subset of `AttributeOptions` (see `./attribute.decorator.ts`) that `createAttributeDef()` reads. */
export interface AttributeDefOptions {
	name?: string;
	type?: AttributeType;
	reflect?: boolean;
	converter?: AttributeConverter;
}

/**
 * Sets `ctor.observedAttributes` (read by `customElements.define()`) from every attribute
 * registered on `ctor` (own + inherited). From a class decorator (`tag()`), pass the decorator's
 * own `context` - `ctor[Symbol.metadata]` isn't assigned yet at that point (see file header); from
 * plain code (`defineElement()`, after the class is fully defined), omit it and the defs are read
 * back via `attributeDefs.get(ctor)`. Call before `customElements.define()`. No-op if none are registered.
 */
export function defineObservedAttributes(ctor: CustomElementConstructor, context?: ClassDecoratorContext): void {
	const defs = context ? attributeDefs.read(context.metadata) : attributeDefs.get(ctor);
	if (defs.length === 0) return;

	const attributes = Array.from(new Set(defs.map(def => def.attribute)));
	// same as define static get observedAttributes()
	Object.defineProperty(ctor, 'observedAttributes', { value: attributes, configurable: true });
}
