import { WILDCARD, registerCustomAttribute, type CustomAttribute } from '../../compiler/custom-attribute.js';
import { rejectArg } from '../reject-arg.js';
import { BooleanAttributePart } from './boolean-part.js';

export const booleanAttributeExtension: CustomAttribute = {
	sigil: '?', name: WILDCARD, single: true,
	validate: b => rejectArg(b.sigil, b.name, b.arg),
	createPart: (el, b) => new BooleanAttributePart(el, b.name, b.modifiers),
};

registerCustomAttribute(booleanAttributeExtension);
