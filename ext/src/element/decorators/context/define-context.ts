// `defineContext(Class, { provide, consume })`: the decorator-free equivalent of `@provide(key)` /
// `@consume(key)`, feeding the same registries (`./metadata.ts`). Call it before `defineElement()`
// / `customElements.define()` so instances upgraded at define time already see the registrations.
//
// ``ts
// defineContext(Root, { provide: { theme: ThemeKey } });
// defineContext(Child, { consume: { theme: ThemeKey } });
// ``

import { addClassHooks, ownMetadata } from '@std-ui/core';
import type { ContextKey } from './key.js';
import { consumedContexts, providedContexts } from './metadata.js';
import { consumeHooks } from './wire-consume.js';
import { provideHooks } from './wire-provide.js';

/** Keys of `I` whose value is a store (readable, writable, peekable). */
type StoreKeys<I> = {
	[K in keyof I]: I[K] extends { (): unknown; peek(): unknown; set(value: never): void } ? K : never;
}[keyof I] & string;

/** `provide` option: store field name -> the `ContextKey` it provides (key value type must match the store's). */
export type ProvideMap<I> = { [K in StoreKeys<I>]?: I[K] extends { peek(): infer V } ? ContextKey<V> : never };

/** `consume` option: field name -> the `ContextKey` it reads (the field is declared with the key's value type). */
export type ConsumeMap<I> = { [K in keyof I & string]?: ContextKey<I[K]> };

export interface DefineContextOptions<I> {
	/** Store fields provided to descendants - same as `@provide(key)`. */
	provide?: ProvideMap<I>;
	/** Fields that read an ancestor's provided value as a plain property - same as `@consume(key)`. */
	consume?: ConsumeMap<I>;
}

/** Registers context provide/consume fields on `ctor`. Returns `ctor`. */
export function defineContext<C extends abstract new (...args: any[]) => object>(
	ctor: C,
	options: DefineContextOptions<InstanceType<C>>,
): C {
	const meta = ownMetadata(ctor);
	for (const [key, contextKey] of Object.entries(options.provide ?? {})) {
		providedContexts.register(meta, { key, contextKey: contextKey as ContextKey<unknown> });
		addClassHooks(meta, provideHooks);
	}
	for (const [key, contextKey] of Object.entries(options.consume ?? {})) {
		consumedContexts.register(meta, { key, contextKey: contextKey as ContextKey<unknown> });
		addClassHooks(meta, consumeHooks);
	}
	return ctor;
}