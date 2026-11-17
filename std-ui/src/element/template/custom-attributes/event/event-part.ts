import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';

/** `@event=${handler}`. Modifiers are not interpreted here (they warn in DEV); `std-ui-ext`
 *  replaces this binding with one that handles `.capture`, `.once`, `.prevent`, etc. */
export class EventPart implements Part, EventListenerObject {
	readonly valueCount = 1;
	#listener: EventListenerOrEventListenerObject | undefined;
	#attached = false;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		modifiers: readonly Modifier[] = [],
		private readonly host?: unknown,
	) {
		warnIgnoredModifiers(`@${name}`, modifiers);
	}
	update(values: readonly unknown[]): void {
		const value = values[0];
		const listener = typeof value === 'function' || (typeof value === 'object' && value !== null)
			? (value as EventListenerOrEventListenerObject)
			: undefined;
		this.#listener = listener;
		// The part itself is the one registered listener (stable identity), so swapping handlers
		// between renders needs no remove/add, and `this` inside a handler is the host.
		if (listener && !this.#attached) {
			this.el.addEventListener(this.name, this);
			this.#attached = true;
		} else if (!listener && this.#attached) {
			this.el.removeEventListener(this.name, this);
			this.#attached = false;
		}
	}
	handleEvent(event: Event): void {
		const l = this.#listener;
		if (typeof l === 'function') l.call(this.host ?? this.el, event);
		else l?.handleEvent(event);
	}
}
