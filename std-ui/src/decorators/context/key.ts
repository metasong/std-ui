// A `ContextKey<T>` is the identity used to link a provider (`@provide(key)` /
// `defineElement({ provide })`, see `./provide.decorator.ts`) to a `@consume(key)` field on some
// descendant element - the context equivalent of an attribute name, except matched by identity,
// not by string, so two unrelated features can never collide just because they picked the same
// name.
//
// Deliberately *not* a plain `string`/`symbol`: those give uniqueness (symbol) or readability
// (string) but neither lets `@consume(key)` infer the value type - every call site would
// need an explicit, unchecked `this.consume<Theme>(key)`. A `ContextKey<T>` instead carries `T` as a
// phantom type (`__type` below is never actually set - it exists purely for TS to read), so
// `V` in `@provide(key)`, `defineElement({ provide })` and `@consume(key)`
// is inferred/checked automatically from whichever key is passed in. Also deliberately *not* "use
// the provider's class as the key" (the Angular-DI-token style): that only works when the context
// value is itself a class instance, and loses the readable `description` used in error messages
// (see `../../ui-element.ts`'s unresolved-context error).

const contextKeyBrand = Symbol('contextKey');

export interface ContextKey<T> {
	readonly [contextKeyBrand]: true;
	/** For debugging/error messages only - never used for matching (identity is). */
	readonly description: string;
	/** Phantom - never actually assigned; exists only so TS can infer/check `T` from the key. */
	readonly __type?: T;
}

/**
 * Creates a fresh, globally-unique context key carrying `T` as its value type. Pair one
 * `@provide(TheKey)` / `defineElement({ provide })` provider with one or more `@consume(TheKey)`
 * stores on any descendant (through any number of intermediate elements/shadow roots) - see
 * `./provide.decorator.ts` and `./wire-consume.ts`.
 *
 * ```ts
 * export const ThemeKey = createContextKey<Theme>('theme');
 * ```
 */
export function createContextKey<T>(description: string): ContextKey<T> {
	return { [contextKeyBrand]: true, description } as ContextKey<T>;
}
