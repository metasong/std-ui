import { WILDCARD, type CustomAttribute } from '../../factory/custom-attribute.js';
import { rejectArg } from '../reject-arg.js';
import { EventPart } from './event-part.js';

export const eventExtension: CustomAttribute = {
	sigil: '@', name: WILDCARD, single: true,
	validate: attributeInfo => rejectArg(attributeInfo.sigil, attributeInfo.name, attributeInfo.arg),
	createPart: (el, attributeInfo, host) => new EventPart(el, attributeInfo.name, attributeInfo.modifiers, host),
};