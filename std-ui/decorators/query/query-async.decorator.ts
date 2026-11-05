import type { UIElement } from '../../ui-element.js';
import { assertPlainField } from './assert-plain-field.js';

/**
 * Read-only field that resolves to a `Promise` of `this.querySelector(selector)`, waiting first for
 * `this.updateComplete` (see `../../ui-element.ts`) so it reflects DOM produced by any render/effect
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
