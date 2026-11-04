// `@property()` registration bookkeeping: recording one `PropertyDef` per decorated field into the
// class's stage-3 decorator `context.metadata` object, and reading it back - at class-definition
// time (for `observedAttributes`) and at runtime (for `attributeChangedCallback`/reflection).
//
// Why `context.metadata`, not `ctor[Symbol.metadata]`: the stage-3 decorators spec gives every
// decorator on a class (member *and* class) the *same* `context.metadata` object, accumulated as
// each member decorator runs - precisely so a class decorator (`tag()` in `../component.ts`)
// can read what member decorators (`property()`) registered, *synchronously, during its own
// execution*. `ctor[Symbol.metadata]` (that same object installed as a static property) is only
// assigned "after the class has been fully defined" (tc39/proposal-decorator-metadata) - which
// includes class decorators having already run - so a class decorator can never see it populated
// during its own call. `ctor[Symbol.metadata]` is fine to read later, at runtime (e.g. from
// `attributeChangedCallback`), once the class is long since defined - see `getPropertyDefs()`.

import type { PropertyConverter } from './converter.js';

// Standard (stage-3) decorators key per-class metadata off `Symbol.metadata`, which isn't declared
// as existing at runtime by every engine/lib yet (nor typed by this project's `lib` setting) -
// polyfill it once, keeping our own reference so we don't depend on the `SymbolConstructor.metadata`
// type declaration (only available with the `esnext.decorators` lib).
const metadataSymbol: symbol = ((Symbol as unknown as Record<string, symbol>).metadata ??= Symbol('Symbol.metadata'));

/** One `@property()`-decorated field, as recorded in a class's `context.metadata` / `[Symbol.metadata]`. */
export interface PropertyDef {
	key: PropertyKey;
	attribute: string;
	reflect: boolean;
	converter: PropertyConverter;
}

const propDefsKey = Symbol('propertyDefs');
type PropertyMetadata = Record<symbol, PropertyDef[] | undefined>;

/**
 * Registers one `PropertyDef` onto `meta` (a class's `context.metadata` object). Own-property
 * check avoids mutating an inherited array from a base class's metadata object (its prototype) -
 * `meta`'s prototype is set up by the decorators spec to be the superclass's own metadata object.
 */
export function registerPropertyDef(meta: object, def: PropertyDef): void {
	const typedMeta = meta as PropertyMetadata;
	const ownDefs = Object.prototype.hasOwnProperty.call(typedMeta, propDefsKey)
		? typedMeta[propDefsKey]!
		: (typedMeta[propDefsKey] = []);
	ownDefs.push(def);
}

/**
 * Walks a decorator-metadata object's prototype chain - per spec, a subclass's metadata object has
 * the superclass's metadata object as its prototype, mirroring the class hierarchy - collecting
 * each level's own `@property()` defs (most-derived first, then ancestors).
 */
function collectPropertyDefs(meta: object | null | undefined): PropertyDef[] {
	const defs: PropertyDef[] = [];
	let level: object | null = meta ?? null;
	while (level) {
		if (Object.prototype.hasOwnProperty.call(level, propDefsKey)) {
			defs.push(...(level as PropertyMetadata)[propDefsKey]!);
		}
		level = Object.getPrototypeOf(level);
	}
	return defs;
}

/**
 * Every `@property()` def (own + inherited) registered on `ctor`, read from `ctor[Symbol.metadata]`
 * - fine to call any time *after* `ctor`'s class declaration has fully finished evaluating (e.g.
 * from an instance method at runtime), but *not* synchronously from within a class decorator
 * applied to `ctor` itself - see `defineObservedAttributes()` for that case, and the file header.
 */
export function getPropertyDefs(ctor: Function): readonly PropertyDef[] {
	const meta = (ctor as unknown as Record<symbol, object | undefined>)[metadataSymbol];
	return collectPropertyDefs(meta);
}

/**
 * Sets `ctor.observedAttributes` (read by `customElements.define()`) from every `@property()`
 * attribute registered on `ctor` (own + inherited), using `context.metadata` - the *class
 * decorator's own* decorator context, received alongside `ctor` - since `ctor[Symbol.metadata]`
 * isn't assigned yet at this point (see file header). Call this from `tag()`, before
 * `customElements.define()`. No-op if no attribute-reflecting properties are registered.
 */
export function defineObservedAttributes(ctor: CustomElementConstructor, context: ClassDecoratorContext): void {
	const defs = collectPropertyDefs(context.metadata);
	if (defs.length === 0) return;
	const attributes = Array.from(new Set(defs.map(def => def.attribute)));
	Object.defineProperty(ctor, 'observedAttributes', { value: attributes, configurable: true });
}
