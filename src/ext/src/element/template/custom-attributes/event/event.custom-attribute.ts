// --- `@event.modifier=${fn}`: event modifiers. ---------------------------------------------------
//
// Importing `@std-ui/ext` registers this (see `../register.ts`) over std-ui's default `@` binding, which ignores modifiers.
// Option/filter modifier parsing lives in `./event-modifiers.ts`, shared with the `@event()` decorator.

import { EventPart, WILDCARD, type CustomAttribute } from '@std-ui/core';

import { DEV } from '../../../../dev/flag.js';
import { applyEventFilters, extractEventModifiers, warnOnce, type EventFilters } from './event-modifiers.js';
import { findEventExtension, type EventAttributeInfo } from './extensions/index.js';

/** Handlers that `@event()` attaches itself; binding one in a template as well would register it twice. */
const autoAttached = new WeakSet<object>();

/** Marks `handler` as attached by `@event()`; DEV-asserted against in `ModifierEventPart.update`. */
export function markAutoAttached(handler: object): void {
	autoAttached.add(handler);
}

/** `EventPart` plus modifiers; listener lifecycle is inherited, only options and filtering differ. */
export class ModifierEventPart extends EventPart {
	readonly #options: AddEventListenerOptions;
	readonly #filters: EventFilters;
	constructor(el: EventTarget, info: EventAttributeInfo, host?: unknown) {
		const { name, modifiers } = info;
		super(el, name, [], host); // no modifiers passed up: the base would warn about all of them
		this.#name = name;
		const extension = findEventExtension(info);
		({ options: this.#options, filters: this.#filters } = extractEventModifiers(`@${name}`, modifiers, !!extension));
		if (extension) this.handler = extension.handler(this.handler, info);
		else if (info.arg !== undefined) warnOnce(`std-ui html: ":${info.arg}" on "@${name}" was ignored.`);
	}
	readonly #name: string;
	override update(values: readonly unknown[]): void {
		const handler = values[0];
		if (DEV && typeof handler === 'function' && autoAttached.has(handler)) {
			throw new Error(`std-ui @${this.#name}: this handler is already attached by @event(); remove the template binding or the decorator's source.element.`);
		}
		super.update(values);
	}
	// The handler's `EVENT_OPTIONS` tag (`withEventOptions`, `@event()`) overrides the modifier-derived options.
	protected override resolveOptions(own: AddEventListenerOptions | undefined): AddEventListenerOptions {
		return { ...this.#options, ...own };
	}
	// A static `filters` property on the handler (by `@event()`) adds to the modifier-derived ones.
	protected override shouldHandle(event: Event, listener: EventListenerOrEventListenerObject | undefined): boolean {
		const own = (listener as { filters?: EventFilters } | undefined)?.filters;
		return applyEventFilters(own ? { ...this.#filters, ...own } : this.#filters, event);
	}
}

/** Replaces the built-in `@` wildcard binding with one that understands modifiers. */
export const eventModifiersExtension: CustomAttribute = {
	sigil: '@', name: WILDCARD, single: true,
	createPart: (el, { name, arg, modifiers }, host) => new ModifierEventPart(el, { name, arg, modifiers }, host),
};
