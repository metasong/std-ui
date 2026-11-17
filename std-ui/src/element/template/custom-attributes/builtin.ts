// --- The native bindings, expressed as ordinary Custom attributes. -------------------------------
//
//   plain attribute   name="a ${b}"     (no sigil; mixed text and several interpolations allowed, the default)
//   .property         .name=${v}
//   ?boolean          ?name=${v}
//   @event            @name.modifier=${fn}
//
// Each is registered for its sigil with the wildcard name `'*'`, so a more specific extension
// (`class.active`) wins when it matches. Nothing in the compiler special-cases them.

import { registerCustomAttribute } from '../compiler/custom-attribute.js';
import { plainAttributeExtension } from './attribute/index.js';
import { propertyExtension } from './property/index.js';
import { booleanAttributeExtension } from './boolean/index.js';
import { eventExtension } from './event/index.js';

for (const extension of [plainAttributeExtension, propertyExtension, booleanAttributeExtension, eventExtension]) {
	registerCustomAttribute(extension);
}
