// `@state({ contextKey })` (provider) and `@consume(contextKey)` (consumer) registration
// bookkeeping - the context-protocol equivalent of `../attribute/metadata.ts`'s `AttributeDef` registry, same
// `context.metadata` mechanism and same reason (see `../attribute/metadata.ts`'s file header): a class
// decorator (`tag()`) and `UIElement.connectedCallback()`/`disconnectedCallback()` both need to
// read back, per-class, which fields provide/consume which `ContextKey`s - accumulated as each
// field decorator on the class runs.

import type { ContextKey } from './key.js';

/** One `@state({ contextKey })`-decorated field, as recorded in a class's `context.metadata`. */
export interface ProvidedContextDef {
	key: PropertyKey;
	contextKey: ContextKey<unknown>;
}

/** One `@consume(contextKey)`-decorated field, as recorded in a class's `context.metadata`. */
export interface ConsumedContextDef {
	key: PropertyKey;
	contextKey: ContextKey<unknown>;
}

const metadataSymbol: symbol = ((Symbol as unknown as Record<string, symbol>).metadata ??= Symbol('Symbol.metadata'));

const providedDefsKey = Symbol('providedContextDefs');
const consumedDefsKey = Symbol('consumedContextDefs');
type ProvidedContextMetadata = Record<symbol, ProvidedContextDef[] | undefined>;
type ConsumedContextMetadata = Record<symbol, ConsumedContextDef[] | undefined>;

/** Registers one `ProvidedContextDef` onto `meta` (a class's `context.metadata` object). */
export function registerProvidedContextDef(meta: object, def: ProvidedContextDef): void {
	const typedMeta = meta as ProvidedContextMetadata;
	const ownDefs = Object.prototype.hasOwnProperty.call(typedMeta, providedDefsKey)
		? typedMeta[providedDefsKey]!
		: (typedMeta[providedDefsKey] = []);
	ownDefs.push(def);
}

/** Registers one `ConsumedContextDef` onto `meta` (a class's `context.metadata` object). */
export function registerConsumedContextDef(meta: object, def: ConsumedContextDef): void {
	const typedMeta = meta as ConsumedContextMetadata;
	const ownDefs = Object.prototype.hasOwnProperty.call(typedMeta, consumedDefsKey)
		? typedMeta[consumedDefsKey]!
		: (typedMeta[consumedDefsKey] = []);
	ownDefs.push(def);
}

/**
 * Walks a decorator-metadata object's prototype chain (same shape `./metadata.ts` walks for
 * `AttributeDef`), collecting each level's own defs (most-derived first, then ancestors).
 */
function collectDefs<D>(meta: object | null | undefined, defsKey: symbol): D[] {
	const defs: D[] = [];
	let level: object | null = meta ?? null;
	while (level) {
		if (Object.prototype.hasOwnProperty.call(level, defsKey)) {
			defs.push(...(level as Record<symbol, D[]>)[defsKey]!);
		}
		level = Object.getPrototypeOf(level);
	}
	return defs;
}

/** Every `@state({ contextKey })` provider def (own + inherited) registered on `ctor`. */
export function getProvidedContextDefs(ctor: Function): readonly ProvidedContextDef[] {
	const meta = (ctor as unknown as Record<symbol, object | undefined>)[metadataSymbol];
	return collectDefs<ProvidedContextDef>(meta, providedDefsKey);
}

/** Every `@consume(contextKey)` consumer def (own + inherited) registered on `ctor`. */
export function getConsumedContextDefs(ctor: Function): readonly ConsumedContextDef[] {
	const meta = (ctor as unknown as Record<symbol, object | undefined>)[metadataSymbol];
	return collectDefs<ConsumedContextDef>(meta, consumedDefsKey);
}
