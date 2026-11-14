import type { UIElement } from '../../ui-element.js';
import { assertPlainField } from './assert-plain-field.js';
import { queryElements } from './query-functions.js';

/**
 * Read-only field that resolves to `this.renderRoot.querySelectorAll(selector)` every time it's read - always
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
				get: (): NodeListOf<T> => queryElements<T>(this, selector),
				enumerable: true,
				configurable: true,
			});
		});
	};
}
