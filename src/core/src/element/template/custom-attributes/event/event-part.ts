import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';

/** Attaches `addEventListener` options to a handler, e.g. `@click=${withEventOptions(fn, { once: true })}`.
 *  Typed so the options are checked as `AddEventListenerOptions`; read back by `EventPart`. */
export function withEventOptions<H extends EventListenerOrEventListenerObject>(
	handler: H,
	options: AddEventListenerOptions,
): H & { options: AddEventListenerOptions } {
	return Object.assign(handler, { options });
}

/** `@event=${handler}`. Modifiers are not interpreted here (they warn in DEV); `@std-ui/ext`
 *  replaces this binding with one that handles `.capture`, `.once`, `.prevent`, etc. */
export class EventPart implements Part, EventListenerObject {
	readonly valueCount = 1;
	#listener: EventListenerOrEventListenerObject | undefined;
	#attached = false;
	#active: AddEventListenerOptions | undefined;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		modifiers: readonly Modifier[] = [],
		private readonly host?: unknown,
	) {
		warnIgnoredModifiers(`@${name}`, modifiers);
	}
	/** Extension hook: merges the handler's own `options` with any part-level options. */
	protected resolveOptions(own: AddEventListenerOptions | undefined): AddEventListenerOptions | undefined {
		return own;
	}
	/** Extension hook: runs before the handler; return `false` to skip it (after any side effects). */
	protected shouldHandle(_event: Event): boolean {
		return true;
	}
	update(values: readonly unknown[]): void {
		const value = values[0];
		const listener = typeof value === 'function' || (typeof value === 'object' && value !== null)
			? (value as EventListenerOrEventListenerObject)
			: undefined;
		this.#listener = listener;
		if (!listener) {
			this.#detach();
			return;
		}
		// A static `options` property on the handler supplies `addEventListener` options.
		const own = (listener as { options?: AddEventListenerOptions }).options;
		const next = this.resolveOptions(typeof own === 'object' && own !== null ? own : undefined);
		const cur = this.#active;
		if (this.#attached && (cur?.capture !== next?.capture || cur?.once !== next?.once || cur?.passive !== next?.passive || cur?.signal !== next?.signal)) {
			this.#detach();
		}
		// The part itself is the one registered listener (stable identity), so swapping handlers
		// between renders needs no remove/add, and `this` inside a handler is the host.
		if (!this.#attached) {
			this.#active = next && { ...next };
			this.el.addEventListener(this.name, this, this.#active);
			this.#attached = true;
		}
	}
	#detach(): void {
		if (!this.#attached) return;
		this.el.removeEventListener(this.name, this, this.#active);
		this.#attached = false;
	}

	handleEvent(event: Event): void {
		if (this.#active?.once) this.#attached = false; // the browser removed us
		if (!this.shouldHandle(event)) return;

		// A new invocation supersedes the previous one, like an effect cleanup.
		this.#cleanup?.();
		const result = this.handler(event);
		this.#cleanup = typeof result === 'function' ? result : undefined;
	}

	/** Dispose returned by the latest `handler` call. */
	#cleanup: (() => void) | undefined;

	/** Teardown (`unmount`, nested disconnect): runs the pending dispose; the listener stays attached. */
	disconnect(): void {
		this.#cleanup?.();
		this.#cleanup = undefined;
	}

	dispose(): void {
		this.#detach();
		this.disconnect();
	}

	/** Runs the listener. May return a dispose function (e.g. to clear a timer); it runs when the
	 *  next event arrives or the part is disposed. */
	handler = (event: Event): void | (() => void) => {
		const l = this.#listener;
		if (typeof l === 'function') l.call(this.host ?? this.el, event);
		else l?.handleEvent(event);
	}
}
