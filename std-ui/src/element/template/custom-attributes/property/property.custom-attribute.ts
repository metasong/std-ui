import { WILDCARD, registerCustomAttribute, type CustomAttribute } from '../../compiler/custom-attribute.js';
import { rejectArg } from '../reject-arg.js';
import { PropertyPart } from './property-part.js';

export const propertyExtension: CustomAttribute = {
	sigil: '.', name: WILDCARD, single: true,
	validate: b => rejectArg(b.sigil, b.name, b.arg),
	createPart: (el, b) => new PropertyPart(el, b.name, b.modifiers),
};

registerCustomAttribute(propertyExtension);
