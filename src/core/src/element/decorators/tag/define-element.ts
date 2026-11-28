// `defineElement(name, Class, options?)`: the decorator-free equivalent of `@tag(name)` plus
// `@attribute()` - registers a `UIElement` subclass as a custom element, with
// attributes declared in typed maps instead of by decorators (see `./README.md`):
//
// ```ts
// class MyBadge extends UIElement {
//   readonly count = store(0);
//   readonly label = store('hi');
// }
// defineElement('my-badge', MyBadge, { attributes: { count: { type: Number, reflect: true }, label: {} } });
// ```
//
// It feeds the very same registry the decorators do (`../attribute/metadata.ts`, `../context/metadata.ts`), then sets
// `observedAttributes` and calls `customElements.define()`. Run it after the class body so the
// statics (`styles`, `shadowRootOptions`, ...) already exist.

import { ownMetadata } from '../class-registry.js';
import type { AttributeOptions } from '../attribute/attribute.decorator.js';
import { attributeDefs, createAttributeDef, defineObservedAttributes } from '../attribute/metadata.js';
import { addClassHooks } from '../../ui-element-hooks.js';
import { attributeHooks } from '../attribute/wire-reflect.js';

/** `attributes` option: field name -> `AttributeOptions`. Fields may be `store()` stores or plain fields (`reflect` needs a store). */
export type AttributesMap<I> = { [K in keyof I & string]?: AttributeOptions };

export interface DefineElementOptions<I> {
	/** Fields mirrored to/from HTML attributes - same options as `@attribute()`. */
	attributes?: AttributesMap<I>;
}

/** Registers `ctor` as the custom element `name`, with optional attribute-mirrored store fields. Returns `ctor`. */
export function defineElement<C extends CustomElementConstructor>(
	name: string,
	ctor: C,
	options: DefineElementOptions<InstanceType<C>> = {},
): C {
	const meta = ownMetadata(ctor);
	for (const [key, attributeOptions] of Object.entries(options.attributes ?? {})) {
		const def = createAttributeDef(key, (attributeOptions ?? {}) as AttributeOptions);
		attributeDefs.register(meta, def);
		addClassHooks(meta, attributeHooks);
	}
	defineObservedAttributes(ctor);
	customElements.define(name, ctor);
	return ctor;
}
