// `@query()` / `@queryAll()` / `@queryAsync()` field decorators, mirroring `lit`'s equivalents:
// read-only accessors over `this.querySelector`/`querySelectorAll` (light DOM here - `UIElement`
// renders into the element itself, not a shadow root, see `../ui-element.ts`).
//
// Like `@state()`/`@attribute()` (`./field-store.ts`), these decorate a *plain* field only (no
// `accessor`) and wire up via the same `addInitializer` + `Object.defineProperty` technique - but
// unlike those, there's no reactive store to back: each access just runs a fresh DOM query (or,
// for `@query(selector, true)`, returns a cached result after the first).
//
// This relies on `tsconfig.json`'s `useDefineForClassFields: true` - without it, a field with no
// initializer at all (`foo!: Foo;`) is erased by the TS/esbuild toolchain as a type-only
// declaration, taking its decorator's `addInitializer` registration down with it (see that
// tsconfig option's comment for why).

import type { UIElement } from '../ui-element.js';

function assertPlainField(context: { kind: string }, name: string): void {
	if (context.kind !== 'field') {
		throw new Error(`@${name}() can only decorate a plain class field (no 'accessor'), e.g. \`@${name}(...) foo!: Foo;\`.`);
	}
}

/**
 * Read-only field that resolves to `this.querySelector(selector)` every time it's read, or - with
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
						if (cached === undefined) cached = this.querySelector<T>(selector);
						return cached;
					}
					return this.querySelector<T>(selector);
				},
				enumerable: true,
				configurable: true,
			});
		});
	};
}

/**
 * Read-only field that resolves to `this.querySelectorAll(selector)` every time it's read - always
 * a fresh, live-at-read-time `NodeList`, never cached (matching `lit`'s `@queryAll()`).
 *
 * ```ts
 * @queryAll('li') items!: NodeListOf<HTMLLIElement>;
 * ```
 */
export function queryAll<T extends Element = HTMLElement>(selector: string) {
	return function queryAllDecorator(_value: undefined, context: ClassFieldDecoratorContext<UIElement, NodeListOf<T>>): void {
		assertPlainField(context, 'queryAll');
		const key = context.name;
		context.addInitializer(function (this: UIElement): void {
			Object.defineProperty(this, key, {
				get(this: UIElement): NodeListOf<T> {
					return this.querySelectorAll<T>(selector);
				},
				enumerable: true,
				configurable: true,
			});
		});
	};
}

/**
 * Read-only field that resolves to a `Promise` of `this.querySelector(selector)`, waiting first for
 * `this.updateComplete` (see `../ui-element.ts`) so it reflects DOM produced by any render/effect
 * still pending at the time it's read - useful when the queried node only appears once `template()`
 * (or a conditional `effect()`) has caught up with a just-written signal.
 *
 * ```ts
 * @queryAsync('.lazy') lazy!: Promise<HTMLElement | null>;
 * ```
 */
export function queryAsync<T extends Element = HTMLElement>(selector: string) {
	return function queryAsyncDecorator(_value: undefined, context: ClassFieldDecoratorContext<UIElement, Promise<T | null>>): void {
		assertPlainField(context, 'queryAsync');
		const key = context.name;
		context.addInitializer(function (this: UIElement): void {
			Object.defineProperty(this, key, {
				get(this: UIElement): Promise<T | null> {
					return this.updateComplete.then(() => this.querySelector<T>(selector));
				},
				enumerable: true,
				configurable: true,
			});
		});
	};
}
