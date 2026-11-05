import { defineObservedAttributes } from './attribute/metadata.js';

/**
 * Class decorator that registers the decorated `UIElement` subclass as a custom element under
 * `name`. Also wires up `observedAttributes` from any `@attribute()`-decorated fields (see
 * `./attribute/`) so the browser calls `attributeChangedCallback` for them - must run before
 * `customElements.define()`, which reads `observedAttributes` once, at definition time.
 */
export function tag(name: string) {
	return function <T extends CustomElementConstructor>(ctor: T, context: ClassDecoratorContext): T {
		defineObservedAttributes(ctor, context);
		customElements.define(name, ctor);
		return ctor;
	};
}
