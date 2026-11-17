import { WILDCARD, type CustomAttribute } from '../../compiler/custom-attribute.js';
import { rejectArg } from '../reject-arg.js';
import { EventPart } from './event-part.js';

export const eventExtension: CustomAttribute = {
	sigil: '@', name: WILDCARD, single: true,
	validate: b => rejectArg(b.sigil, b.name, b.arg),
	createPart: (el, b, host) => new EventPart(el, b.name, b.modifiers, host),
};
