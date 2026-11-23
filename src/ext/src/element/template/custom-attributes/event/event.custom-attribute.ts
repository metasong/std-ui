// --- `@event.modifier=${fn}`: event modifiers. ---------------------------------------------------
//
// Importing `@std-ui/ext` registers this (see `../register.ts`) over std-ui's default `@` binding, which ignores modifiers.

import { EventPart, WILDCARD, type CustomAttribute, type Modifier } from '@std-ui/core';

import { findEventExtension, type EventAttributeInfo } from './extensions/index.js';

const OPTION_MODIFIERS = ['capture', 'once', 'passive'] as const;
const FILTER_MODIFIERS = ['prevent', 'stop', 'stop-immediate', 'self'] as const;

type EventFilters = Partial<Record<(typeof FILTER_MODIFIERS)[number], true>>;

const warned = new Set<string>();

/** Splits modifiers into `addEventListener` options and handler filters; warns on unknown ones. */
function warnOnce(message: string): void {
	if (warned.has(message)) return;
	warned.add(message);
	console.warn(message);
}

/** Splits modifiers into `addEventListener` options and handler filters. Unknown ones are warned
 *  about, unless a chosen extension (`claimed`) interprets them. */
function extractEventModifiers(binding: string, modifiers: readonly Modifier[], claimed: boolean) {
	const options: AddEventListenerOptions = {};
	const filters: EventFilters = {};
	for (const mod of modifiers) {
		if ((OPTION_MODIFIERS as readonly string[]).includes(mod.name) && mod.value === undefined) {
			options[mod.name as (typeof OPTION_MODIFIERS)[number]] = true;
		} else if ((FILTER_MODIFIERS as readonly string[]).includes(mod.name) && mod.value === undefined) {
			filters[mod.name as keyof EventFilters] = true;
		} else if (!claimed) {
			warnOnce(`std-ui html: unsupported modifier ".${mod.name}${mod.value === undefined ? '' : `:${mod.value}`}" on "${binding}" was ignored.`);
		}
	}
	return { options, filters };
}

/** `EventPart` plus modifiers; listener lifecycle is inherited, only options and filtering differ. */
export class ModifierEventPart extends EventPart {
	readonly #options: AddEventListenerOptions;
	readonly #filters: EventFilters;
	constructor(el: Element, info: EventAttributeInfo, host?: unknown) {
		const { name, modifiers } = info;
		super(el, name, [], host); // no modifiers passed up: the base would warn about all of them
		const extension = findEventExtension(info);
		({ options: this.#options, filters: this.#filters } = extractEventModifiers(`@${name}`, modifiers, !!extension));
		if (extension) this.handler = extension.handler(this.handler, info);
		else if (info.arg !== undefined) warnOnce(`std-ui html: ":${info.arg}" on "@${name}" was ignored.`);
	}
	// A static `options` property on the handler overrides the modifier-derived options.
	protected override resolveOptions(own: AddEventListenerOptions | undefined): AddEventListenerOptions {
		return { ...this.#options, ...own };
	}
	protected override shouldHandle(event: Event): boolean {
		const f = this.#filters;
		if (f.self && event.target !== event.currentTarget) return false;
		if (f.prevent) event.preventDefault();
		if (f.stop) event.stopPropagation();
		if (f['stop-immediate']) event.stopImmediatePropagation();
		return true;
	}
}

/** Replaces the built-in `@` wildcard binding with one that understands modifiers. */
export const eventModifiersExtension: CustomAttribute = {
	sigil: '@', name: WILDCARD, single: true,
	createPart: (el, { name, arg, modifiers }, host) => new ModifierEventPart(el, { name, arg, modifiers }, host),
};
