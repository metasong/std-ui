// `@query()` field decorator — read-only accessor over `this.renderRoot.querySelector`
// (see `../../ui-element.ts` — light DOM by default, or shadow when `shadowRootOptions` is set).
//
// Like `@state()`/`@attribute()` (`../field-store.ts`), this decorates a *plain* field only (no
// `accessor`) and wires up via the same `addInitializer` + `Object.defineProperty` technique - but
// unlike those, there's no reactive store: each access runs a fresh DOM query (or, with
// `@query(selector, true)`, returns a cached result after the first).
//
// This relies on `tsconfig.json`'s `useDefineForClassFields: true` - without it, a field with no
// initializer at all (`foo!: Foo;`) is erased by the TS/esbuild toolchain as a type-only
// declaration, taking its decorator's `addInitializer` registration down with it.

import type { UIElement } from '../../ui-element.js';
import { assertPlainField } from './assert-plain-field.js';

/**
 * Read-only field that resolves to `this.renderRoot.querySelector(selector)` every time it's read, or - with
 * `cache: true` - only once, the first time it's read (safe only for a node that's never replaced).
 *
 * ```ts
 * @query('#input') input!: HTMLInputElement | null;
 * @query('.title', true) title!: HTMLElement | null; // resolved once, then cached
 * ```
 */
export function query<T extends Element = HTMLElement>(selector: string, cache = false) {
	return function queryDecorator(_value: undefined, context: ClassFieldDecoratorContext<UIElement, T | null>): void {
		assertPlainField(context, 'query');
		const key = context.name;
		context.addInitializer(function (this: UIElement): void {
			let cached: T | null | undefined;
			Object.defineProperty(this, key, {
				get(this: UIElement): T | null {
					if (cache) {
						if (cached === undefined) cached = this.renderRoot.querySelector<T>(selector);
						return cached;
					}
					return this.renderRoot.querySelector<T>(selector);
				},
				enumerable: true,
				configurable: true,
			});
		});
	};
}
