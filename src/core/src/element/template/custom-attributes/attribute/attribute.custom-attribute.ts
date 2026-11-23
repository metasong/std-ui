import { WILDCARD, type CustomAttribute } from '../../factory/custom-attribute.js';
import { AttributePart } from './attribute-part.js';
import { rejectArg } from '../reject-arg.js';

export const plainAttributeExtension: CustomAttribute = {
	sigil: '', name: WILDCARD,
	validate(attributeInfo) {
		// `name:arg` is part of the grammar but reserved: only extensions may consume it.
		rejectArg(attributeInfo.sigil, attributeInfo.name, attributeInfo.arg);
	},
	createPart: (el, attributeInfo, _host, v) => new AttributePart(el, attributeInfo.name, [...v.literals], attributeInfo.modifiers),
};