import { WILDCARD, type CustomAttribute } from '../../factory/custom-attribute.js';
import { rejectArg } from '../reject-arg.js';
import { BooleanAttributePart } from './boolean-part.js';

export const booleanAttributeExtension: CustomAttribute = {
	sigil: '?', name: WILDCARD, single: true,
	validate: attributeInfo => rejectArg(attributeInfo.sigil, attributeInfo.name, attributeInfo.arg),
	createPart: (el, attributeInfo) => new BooleanAttributePart(el, attributeInfo.name, attributeInfo.modifiers),
};