// --- The native bindings, expressed as ordinary binding extensions. -------------------------------
//
//   plain attribute   name="a ${b}"     (no sigil; mixed text and several interpolations allowed, the default)
//   .property         .name=${v}
//   ?boolean          ?name=${v}
//   @event            @name.modifier=${fn}
//
// Each is registered for its sigil with the wildcard name `'*'`, so a more specific extension
// (`class.active`) wins when it matches. Nothing in the compiler special-cases them.

import { registerBindingExtension, WILDCARD, type BindingExtension } from '../compiler/binding-extension.js';
import { AttributePart, BooleanAttributePart, EventPart, PropertyPart } from '../parts/index.js';

export const plainAttributeExtension: BindingExtension = {
	sigil: '', name: WILDCARD,
	validate(b) {
		// `name:arg` is part of the grammar but reserved: only extensions may consume it.
		if (b.arg !== undefined) throw new Error(`std-ui html: "${b.name}:${b.arg}" - ":arg" on a binding name is reserved and not supported yet.`);
	},
	createPart: (el, b, _host, v) => new AttributePart(el, b.name, [...v.literals], b.modifiers),
};

export const propertyExtension: BindingExtension = {
	sigil: '.', name: WILDCARD, single: true,
	validate: b => rejectArg(b.sigil, b.name, b.arg),
	createPart: (el, b) => new PropertyPart(el, b.name, b.modifiers),
};

export const booleanAttributeExtension: BindingExtension = {
	sigil: '?', name: WILDCARD, single: true,
	validate: b => rejectArg(b.sigil, b.name, b.arg),
	createPart: (el, b) => new BooleanAttributePart(el, b.name, b.modifiers),
};

export const eventExtension: BindingExtension = {
	sigil: '@', name: WILDCARD, single: true,
	validate: b => rejectArg(b.sigil, b.name, b.arg),
	createPart: (el, b, host) => new EventPart(el, b.name, b.modifiers, host),
};

function rejectArg(sigil: string, name: string, arg: string | undefined): void {
	if (arg !== undefined) throw new Error(`std-ui html: "${sigil}${name}:${arg}" - ":arg" on a binding name is reserved and not supported yet.`);
}

for (const extension of [plainAttributeExtension, propertyExtension, booleanAttributeExtension, eventExtension]) {
	registerBindingExtension(extension);
}
