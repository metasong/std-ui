// The only module in `@std-ui/ext` with an import-time side effect (listed in `package.json` `sideEffects`):
// importing `@std-ui/ext` enables `class.x`, `style.x` and `@event.modifier` bindings.
import { registerCustomAttribute } from '@std-ui/core';
import { classAttributeExtension, styleAttributeExtension } from './class-style/class-style.custom-attribute.js';
import { eventModifiersExtension } from './event/event.custom-attribute.js';

function registerExtCustomAttributes(): void {
	registerCustomAttribute(classAttributeExtension);
	registerCustomAttribute(styleAttributeExtension);
	// Replaces core's built-in `@` wildcard binding with one that understands modifiers.
	registerCustomAttribute(eventModifiersExtension);
}

registerExtCustomAttributes();
