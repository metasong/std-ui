// Class-level context registrations: which fields of a class provide / consume which `ContextKey`.
//
// Each kind (provided, consumed) is a `ClassRegistry` (`std-ui's class-registry`): `@provide` / `@consume` record
// into the class's decorator metadata, `defineContext(Class, { provide, consume })` into the class's own metadata object.

import { createClassRegistry } from '@std-ui/core';
import type { ContextKey } from './key.js';

/** A field that provides or consumes a context: `host[key]` is the store / the read value for `contextKey`. */
export interface ContextFieldDef {
	key: PropertyKey;
	contextKey: ContextKey<unknown>;
}

/** One provided store field, answered for requests carrying `contextKey`. */
export type ProvidedContextDef = ContextFieldDef;

/** One consumed field, reading the nearest ancestor provider's value for `contextKey`. */
export type ConsumedContextDef = ContextFieldDef;

/** Fields a class provides: `.get(ctor)`, `.register(meta, def)`. */
export const providedContexts = createClassRegistry<ProvidedContextDef>('providedContextDefs');

/** Fields a class consumes - same shape as `providedContexts`. */
export const consumedContexts = createClassRegistry<ConsumedContextDef>('consumedContextDefs');
