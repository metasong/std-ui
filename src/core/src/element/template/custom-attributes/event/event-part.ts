import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';

/** Attaches `addEventListener` options to a handler, e.g. `@click=${withEventOptions(fn, { once: true })}`.
 *  Typed so the options are checked as `AddEventListenerOptions`; read back by `EventPart`. */
export function withEventOptions<H extends EventListenerOrEventListenerObject>(
	handler: H,
	options: AddEventListenerOptions,
): H & { options: AddEventListenerOptions } {
	// Wrap instead of tagging `handler` itself: the same function may be reused elsewhere (e.g. a
	// shared method) and must not pick up these options. `this` is forwarded for host-bound handlers.
	const wrapped = typeof handler === 'function'
		? function (this: unknown, event: Event) { return (handler as (this: unknown, e: Event) => unknown).call(this, event); }
		: { handleEvent: (event: Event) => handler.handleEvent(event) };
	return Object.assign(wrapped, { options }) as unknown as H & { options: AddEventListenerOptions };
}

/** Whether an `EventPart` currently has its listener registered on the element. */
const ListenerState = {
	/** Not registered: before the first handler, after the handler became non-callable, or after
	 *  the options changed (so it must be re-added). The next valid `update()` registers it. */
	DETACHED: 0,
	/** Registered with `addEventListener`; handler swaps need no re-registration. */
	ATTACHED: 1,
	/** A `once` listener fired and the browser removed it. Re-renders must not re-arm it; it stays
	 *  this way until the binding stops being `once`, which returns it to `DETACHED`. */
	SPENT: 2,
} as const;
type ListenerState = (typeof ListenerState)[keyof typeof ListenerState];

/** `@event=${handler}`. Modifiers are not interpreted here (they warn in DEV); `@std-ui/ext`
 *  replaces this binding with one that handles `.capture`, `.once`, `.prevent`, etc. */
export class EventPart implements Part, EventListenerObject {
	readonly valueCount = 1;
	#listener: EventListenerOrEventListenerObject | undefined;
	/** `DETACHED`: not registered; `ATTACHED`: registered; `SPENT`: a `once` listener fired and the
	 *  browser removed it - stays that way until the binding stops being `once`. */
	#state: ListenerState = ListenerState.DETACHED;
	#active: AddEventListenerOptions | undefined;
	/** Dispose returned by the latest `handler` call. */
	#cleanup: (() => void) | undefined;
	readonly #el: Element;
	readonly #name: string;
	readonly #host: unknown;
	constructor(el: Element, name: string, modifiers: readonly Modifier[] = [], host?: unknown) {
		this.#el = el;
		this.#name = name;
		this.#host = host;
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
		// `once` means once per binding: after it fired, re-renders must not re-arm it. Dropping `once` re-enables it.
		if (this.#state === ListenerState.SPENT) {
			if (next?.once) return;
			this.#state = ListenerState.DETACHED;
		}
		const cur = this.#active;
		if (this.#state === ListenerState.ATTACHED && (cur?.capture !== next?.capture || cur?.once !== next?.once || cur?.passive !== next?.passive || cur?.signal !== next?.signal)) {
			this.#detach();
		}
		// The part itself is the one registered listener (stable identity), so swapping handlers
		// between renders needs no remove/add, and `this` inside a handler is the host.
		if (this.#state === ListenerState.DETACHED) {
			this.#active = next && { ...next };
			this.#el.addEventListener(this.#name, this, this.#active);
			this.#state = ListenerState.ATTACHED;
		}
	}
	#detach(): void {
		if (this.#state !== ListenerState.ATTACHED) return;
		this.#el.removeEventListener(this.#name, this, this.#active);
		this.#state = ListenerState.DETACHED;
	}

	handleEvent(event: Event): void {
		if (this.#active?.once) this.#state = ListenerState.SPENT; // the browser removed us
		if (!this.shouldHandle(event)) return;

		// A new invocation supersedes the previous one, like an effect cleanup.
		this.#cleanup?.();
		const result = this.handler(event);
		this.#cleanup = typeof result === 'function' ? result : undefined;
	}

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
		if (typeof l === 'function') l.call(this.#host ?? this.#el, event);
		else l?.handleEvent(event);
	}
}
