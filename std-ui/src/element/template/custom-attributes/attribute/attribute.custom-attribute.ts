import { WILDCARD, registerCustomAttribute, type CustomAttribute } from '../../compiler/custom-attribute.js';
import { AttributePart } from './attribute-part.js';

export const plainAttributeExtension: CustomAttribute = {
	sigil: '', name: WILDCARD,
	validate(b) {
		// `name:arg` is part of the grammar but reserved: only extensions may consume it.
		if (b.arg !== undefined) throw new Error(`std-ui html: "${b.name}:${b.arg}" - ":arg" on a binding name is reserved and not supported yet.`);
	},
	createPart: (el, b, _host, v) => new AttributePart(el, b.name, [...v.literals], b.modifiers),
};

registerCustomAttribute(plainAttributeExtension);
