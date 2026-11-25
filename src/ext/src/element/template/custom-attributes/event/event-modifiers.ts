// Shared interpretation of `@event.modifier` names: used by the modifier-aware binding
// and by the `@event()` decorator, so both understand exactly the same modifiers.

import type { Modifier } from '@std-ui/core';

import { DEV } from '../../../../dev/flag.js';

/** Handler-side counterpart of `AddEventListenerOptions`: what to do with the event before the handler runs. */
export interface EventFilters {
	/** `event.preventDefault()` */
	prevent?: boolean;
	/** `event.stopPropagation()` */
	stop?: boolean;
	/** `event.stopImmediatePropagation()` */
	'stop-immediate'?: boolean;
	/** Skip events that did not originate on the element itself (`event.target === event.currentTarget`). */
	self?: boolean;
}

const warned = new Set<string>();

/** DEV-deduped `console.warn`. */
export function warnOnce(message: string): void {
	if (!DEV || warned.has(message)) return;
	warned.add(message);
	console.warn(message);
}

/** Splits modifiers into `addEventListener` options and handler filters. Unknown ones are warned
 *  about, unless a chosen extension (`claimed`) interprets them. */
export function extractEventModifiers(binding: string, modifiers: readonly Modifier[], claimed: boolean) {
	const options: AddEventListenerOptions = {};
	const filters: EventFilters = {};
	for (const mod of modifiers) {
		// Only bare modifiers (no `:value`) are interpreted here.
		const known = mod.value === undefined;
		if (known && (mod.name === 'capture' || mod.name === 'once' || mod.name === 'passive')) options[mod.name] = true;
		else if (known && (mod.name === 'prevent' || mod.name === 'stop' || mod.name === 'stop-immediate' || mod.name === 'self')) filters[mod.name] = true;
		else if (!claimed) {
			warnOnce(`std-ui html: unsupported modifier ".${mod.name}${mod.value === undefined ? '' : `:${mod.value}`}" on "${binding}" was ignored.`);
		}
	}
	return { options, filters };
}

/** Applies `filters` to `event`; returns `false` when the handler must be skipped (`.self` mismatch). */
export function applyEventFilters(filters: EventFilters, event: Event): boolean {
	if (filters.self && event.target !== event.currentTarget) return false;
	if (filters.prevent) event.preventDefault();
	if (filters.stop) event.stopPropagation();
	if (filters['stop-immediate']) event.stopImmediatePropagation();
	return true;
}

/** Parses `name.mod1.mod2:value` (the template attribute syntax, without sigil/arg) into name + modifiers. */
export function parseEventName(spec: string): { name: string; modifiers: Modifier[] } {
	const [name = '', ...rest] = spec.split('.');
	return {
		name,
		modifiers: rest.map(part => {
			const i = part.indexOf(':');
			return i < 0 ? { name: part } : { name: part.slice(0, i), value: part.slice(i + 1) };
		}),
	};
}
