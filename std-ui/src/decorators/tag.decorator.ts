import { defineObservedAttributes } from './attribute/metadata.js';

// Same `Symbol.metadata` polyfill-or-reuse as `./attribute/metadata.ts` / `./context/metadata.ts` -
// see the note below for why `tag()` needs to assign it itself rather than letting the engine do it.
const metadataSymbol: symbol = ((Symbol as unknown as Record<string, symbol>).metadata ??= Symbol('Symbol.metadata'));

/**
 * Class decorator that registers the decorated `UIElement` subclass as a custom element under
 * `name`. Also wires up `observedAttributes` from any `@attribute()`-decorated fields (see
 * `./attribute/`) so the browser calls `attributeChangedCallback` for them - must run before
 * `customElements.define()`, which reads `observedAttributes` once, at definition time.
 *
 * Also eagerly copies `context.metadata` onto `ctor[Symbol.metadata]` *before* calling
 * `customElements.define()`, rather than relying on the engine to do this once every class
 * decorator has finished (the normal stage-3-decorators behavior - see
 * `./attribute/metadata.ts`'s file header). This matters because `customElements.define()`
 * synchronously *upgrades* any matching elements already present in the document (e.g. static
 * markup parsed before this module ran) - firing their `attributeChangedCallback`/
 * `connectedCallback` reactions immediately, inside this very call, while `tag()` (a class
 * decorator) is still running. Those reactions read `getAttributeDefs()`/`getProvidedContextDefs()`/
 * `getConsumedContextDefs()` (`./attribute/metadata.ts`, `./context/metadata.ts`) off
 * `ctor[Symbol.metadata]` - which, left to the engine's default timing, isn't populated yet at that
 * point, so every `@attribute()`/`@state({ contextKey })`/`@consume()` field on a pre-existing,
 * statically-marked-up element would silently see no defs (attributes never parsed from markup,
 * context never provided/consumed) on first upgrade. Assigning the same `context.metadata` object
 * here is a no-op once the engine assigns it moments later (identical reference).
 */
export function tag(name: string) {
	return function <T extends CustomElementConstructor>(ctor: T, context: ClassDecoratorContext): T {
		defineObservedAttributes(ctor, context);
		(ctor as unknown as Record<symbol, object>)[metadataSymbol] = context.metadata;
		customElements.define(name, ctor);
		return ctor;
	};
}
