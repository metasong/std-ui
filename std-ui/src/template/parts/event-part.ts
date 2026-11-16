import { type Modifier, type Part, warnIgnoredModifiers } from './main.js';

const OPTION_MODIFIERS = ['capture', 'once', 'passive'] as const;
const FILTER_MODIFIERS = ['prevent', 'stop', 'stop-immediate', 'self'] as const;

type EventFilters = Partial<Record<(typeof FILTER_MODIFIERS)[number], true>>;

/** Splits `@event.modifier` modifiers into `addEventListener` options (`capture`/`once`/`passive`)
 *  and handler filters (`prevent`/`stop`/`stop-immediate`/`self`). Unrecognized ones are ignored. */
function extractEventModifiers(modifiers: readonly Modifier[]) {
	const options: AddEventListenerOptions = {};
	const filters: EventFilters = {};
	for (const mod of modifiers) {
		if ((OPTION_MODIFIERS as readonly string[]).includes(mod.name) && mod.arg === undefined) {
			options[mod.name as (typeof OPTION_MODIFIERS)[number]] = true;
		} else if ((FILTER_MODIFIERS as readonly string[]).includes(mod.name) && mod.arg === undefined) {
			filters[mod.name as keyof EventFilters] = true;
		}
	}
	return { options, filters };
}

export class EventPart implements Part, EventListenerObject {
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
		warnIgnoredModifiers(`@${name}`, modifiers, [...OPTION_MODIFIERS, ...FILTER_MODIFIERS]);
		({ options: this.#options, filters: this.#filters } = extractEventModifiers(modifiers));
	}
	update(values: readonly unknown[]): void {
		const value = values[0];
		const listener = typeof value === 'function' || (typeof value === 'object' && value !== null)
			? (value as EventListenerOrEventListenerObject)
			: undefined;
		this.#listener = listener;
		// The part itself is the one registered listener (stable identity), so swapping handlers
		// between renders needs no remove/add, and `this` inside a handler is the host (like lit).
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
