import { registerCustomAttribute } from '../factory/custom-attribute.js';
import { plainAttributeExtension } from './attribute/index.js';
import { propertyExtension } from './property/index.js';
import { booleanAttributeExtension } from './boolean/index.js';
import { eventExtension } from './event/index.js';

/** Registers the built-in bindings: plain attribute, `.prop`, `?bool`, `@event`. Idempotent. */
export function registerBuiltinCustomAttributes(): void {
	registerCustomAttribute(plainAttributeExtension);
	registerCustomAttribute(propertyExtension);
	registerCustomAttribute(booleanAttributeExtension);
	registerCustomAttribute(eventExtension);
}
