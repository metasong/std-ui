import { WILDCARD, registerCustomAttribute, type CustomAttribute } from '../../factory/custom-attribute.js';
import { AttributePart } from './attribute-part.js';
import { DEV } from '../../../../dev/flag.js';

export const plainAttributeExtension: CustomAttribute = {
	sigil: '', name: WILDCARD,
	validate(attributeInfo) {
		// `name:arg` is part of the grammar but reserved: only extensions may consume it.
		if (attributeInfo.arg !== undefined) throw new Error(DEV ? `std-ui html: "${attributeInfo.name}:${attributeInfo.arg}" - ":arg" on a binding name is reserved and not supported yet.` : 'std-ui: ":arg" unsupported');
	},
	createPart: (el, attributeInfo, _host, v) => new AttributePart(el, attributeInfo.name, [...v.literals], attributeInfo.modifiers),
};

registerCustomAttribute(plainAttributeExtension);
