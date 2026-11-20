import { WILDCARD, registerCustomAttribute, type CustomAttribute } from '../../compiler/custom-attribute.js';
import { rejectArg } from '../reject-arg.js';
import { PropertyPart } from './property-part.js';

export const propertyExtension: CustomAttribute = {
	sigil: '.', name: WILDCARD, single: true,
	validate: attributeInfo => rejectArg(attributeInfo.sigil, attributeInfo.name, attributeInfo.arg),
	createPart: (el, attributeInfo) => new PropertyPart(el, attributeInfo.name, attributeInfo.modifiers),
};

registerCustomAttribute(propertyExtension);
