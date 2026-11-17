// --- `@event.modifier=${fn}`: event modifiers. ---------------------------------------------------
//
// Importing `std-ui-ext` registers this over std-ui's default `@` binding, which ignores modifiers.

import { EventPart, registerCustomAttribute, type CustomAttribute, type Modifier } from 'std-ui';

const OPTION_MODIFIERS = ['capture', 'once', 'passive'] as const;
const FILTER_MODIFIERS = ['prevent', 'stop', 'stop-immediate', 'self'] as const;

type EventFilters = Partial<Record<(typeof FILTER_MODIFIERS)[number], true>>;

const warned = new Set<string>();

/** Splits modifiers into `addEventListener` options and handler filters; warns on unknown ones. */
function extractEventModifiers(binding: string, modifiers: readonly Modifier[]) {
	const options: AddEventListenerOptions = {};
	const filters: EventFilters = {};
	for (const mod of modifiers) {
		if ((OPTION_MODIFIERS as readonly string[]).includes(mod.name) && mod.value === undefined) {
			options[mod.name as (typeof OPTION_MODIFIERS)[number]] = true;
		} else if ((FILTER_MODIFIERS as readonly string[]).includes(mod.name) && mod.value === undefined) {
			filters[mod.name as keyof EventFilters] = true;
		} else {
			const message = `std-ui html: unsupported modifier ".${mod.name}${mod.value === undefined ? '' : `:${mod.value}`}" on "${binding}" was ignored.`;
			if (!warned.has(message)) {
				warned.add(message);
				console.warn(message);
			}
		}
	}
	return { options, filters };
}

/** `EventPart` plus modifiers; listener lifecycle is inherited, only options and filtering differ. */
export class ModifierEventPart extends EventPart {
	readonly #options: AddEventListenerOptions;
	readonly #filters: EventFilters;
	constructor(el: Element, name: string, modifiers: readonly Modifier[] = [], host?: unknown) {
		super(el, name, [], host); // no modifiers passed up: the base would warn about all of them
		({ options: this.#options, filters: this.#filters } = extractEventModifiers(`@${name}`, modifiers));
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
	sigil: '@', name: '*', single: true,
	validate(b) {
		if (b.arg !== undefined) throw new Error(`std-ui html: "${b.sigil}${b.name}:${b.arg}" - ":arg" is not supported on ${b.sigil}${b.name}.`);
	},
	createPart: (el, b, host) => new ModifierEventPart(el, b.name, b.modifiers, host),
};

registerCustomAttribute(eventModifiersExtension);
