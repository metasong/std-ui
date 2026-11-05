// `@attribute()` registration bookkeeping: recording one `AttributeDef` per decorated field into
// the class's stage-3 decorator `context.metadata` object, and reading it back - at
// class-definition time (for `observedAttributes`) and at runtime (for
// `attributeChangedCallback`/reflection). `@state()` fields never register here - they have no
// attribute concern at all (see `./state.ts`).
//
// Why `context.metadata`, not `ctor[Symbol.metadata]`: the stage-3 decorators spec gives every
// decorator on a class (member *and* class) the *same* `context.metadata` object, accumulated as
// each member decorator runs - precisely so a class decorator (`tag()` in `../component.ts`)
// can read what member decorators (`attribute()`) registered, *synchronously, during its own
// execution*. `ctor[Symbol.metadata]` (that same object installed as a static property) is only
// assigned "after the class has been fully defined" (tc39/proposal-decorator-metadata) - which
// includes class decorators having already run - so a class decorator can never see it populated
// during its own call. `tag()` reads `context.metadata` for this reason; `getAttributeDefs()`
// (used later at runtime) reads `ctor[Symbol.metadata]`, which by then is populated.

import type { AttributeConverter } from './converter.js';

// Standard (stage-3) decorators key per-class metadata off `Symbol.metadata`, which isn't declared
// as existing at runtime by every engine/lib yet (nor typed by this project's `lib` setting) -
// polyfill it once, keeping our own reference so we don't depend on the `SymbolConstructor.metadata`
// type declaration (only available with the `esnext.decorators` lib).
const metadataSymbol: symbol = ((Symbol as unknown as Record<string, symbol>).metadata ??= Symbol('Symbol.metadata'));

/** One `@attribute()`-decorated field, as recorded in a class's `context.metadata` / `[Symbol.metadata]`. */
export interface AttributeDef {
	key: PropertyKey;
	attribute: string;
	reflect: boolean;
	converter: AttributeConverter;
}

const attrDefsKey = Symbol('attributeDefs');
type AttributeMetadata = Record<symbol, AttributeDef[] | undefined>;

/**
 * Registers one `AttributeDef` onto `meta` (a class's `context.metadata` object). Own-property
 * check avoids mutating an inherited array from a base class's metadata object (its prototype) -
 * `meta`'s prototype is set up by the decorators spec to be the superclass's own metadata object.
 */
export function registerAttributeDef(meta: object, def: AttributeDef): void {
	const typedMeta = meta as AttributeMetadata;
	const ownDefs = Object.prototype.hasOwnProperty.call(typedMeta, attrDefsKey)
		? typedMeta[attrDefsKey]!
		: (typedMeta[attrDefsKey] = []);
	ownDefs.push(def);
}

/**
 * Walks a decorator-metadata object's prototype chain - per spec, a subclass's metadata object has
 * the superclass's metadata object as its prototype, mirroring the class hierarchy - collecting
 * each level's own `@attribute()` defs (most-derived first, then ancestors).
 */
function collectAttributeDefs(meta: object | null | undefined): AttributeDef[] {
	const defs: AttributeDef[] = [];
	let level: object | null = meta ?? null;
	while (level) {
		if (Object.prototype.hasOwnProperty.call(level, attrDefsKey)) {
			defs.push(...(level as AttributeMetadata)[attrDefsKey]!);
		}
		level = Object.getPrototypeOf(level);
	}
	return defs;
}

/**
 * Every `@attribute()` def (own + inherited) registered on `ctor`, read from `ctor[Symbol.metadata]`
 * - fine to call any time *after* `ctor`'s class declaration has fully finished evaluating (e.g.
 * from an instance method at runtime), but *not* synchronously from within a class decorator
 * applied to `ctor` itself - see `defineObservedAttributes()` for that case, and the file header.
 */
export function getAttributeDefs(ctor: Function): readonly AttributeDef[] {
	const meta = (ctor as unknown as Record<symbol, object | undefined>)[metadataSymbol];
	return collectAttributeDefs(meta);
}

/**
 * Sets `ctor.observedAttributes` (read by `customElements.define()`) from every `@attribute()`
 * attribute registered on `ctor` (own + inherited), using `context.metadata` - the *class
 * decorator's own* decorator context, received alongside `ctor` - since `ctor[Symbol.metadata]`
 * isn't assigned yet at this point (see file header). Call this from `tag()`, before
 * `customElements.define()`. No-op if no attribute-reflecting properties are registered.
 */
export function defineObservedAttributes(ctor: CustomElementConstructor, context: ClassDecoratorContext): void {
	const defs = collectAttributeDefs(context.metadata);
	if (defs.length === 0) return;
	const attributes = Array.from(new Set(defs.map(def => def.attribute)));
	Object.defineProperty(ctor, 'observedAttributes', { value: attributes, configurable: true });
}
