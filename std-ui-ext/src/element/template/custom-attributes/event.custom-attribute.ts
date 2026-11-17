// --- `@event.modifier=${fn}`: event modifiers. ---------------------------------------------------
//
// Importing `std-ui-ext` registers this over std-ui's default `@` binding, which ignores modifiers.

import { registerCustomAttribute, type CustomAttribute, type Modifier, type Part } from 'std-ui';

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

export class ModifierEventPart implements Part, EventListenerObject {
	readonly valueCount = 1;
	#listener: EventListenerOrEventListenerObject | undefined;
	#attached = false;
	readonly #options: AddEventListenerOptions;
	readonly #filters: EventFilters;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		modifiers: readonly Modifier[] = [],
		private readonly host?: unknown,
	) {
		({ options: this.#options, filters: this.#filters } = extractEventModifiers(`@${name}`, modifiers));
	}
	update(values: readonly unknown[]): void {
		const value = values[0];
		const listener = typeof value === 'function' || (typeof value === 'object' && value !== null)
			? (value as EventListenerOrEventListenerObject)
			: undefined;
		this.#listener = listener;
		if (listener && !this.#attached) {
			this.el.addEventListener(this.name, this, this.#options);
			this.#attached = true;
		} else if (!listener && this.#attached) {
			this.el.removeEventListener(this.name, this, this.#options);
			this.#attached = false;
		}
	}
	handleEvent(event: Event): void {
		if (this.#options.once) this.#attached = false; // the browser removed us
		const f = this.#filters;
		if (f.self && event.target !== event.currentTarget) return;
		if (f.prevent) event.preventDefault();
		if (f.stop) event.stopPropagation();
		if (f['stop-immediate']) event.stopImmediatePropagation();
		const l = this.#listener;
		if (typeof l === 'function') l.call(this.host ?? this.el, event);
		else l?.handleEvent(event);
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
