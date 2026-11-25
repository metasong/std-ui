import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';

/** Key under which a handler carries its `AddEventListenerOptions`. A symbol, so a listener object with its own
 *  `options` field is never misread; `Symbol.for` so core and ext agree even if loaded as separate copies. */
export const EVENT_OPTIONS: unique symbol = Symbol.for('std-ui.eventOptions') as never;

type WithOptions = { [EVENT_OPTIONS]?: AddEventListenerOptions };

/** Tags `handler` with `AddEventListenerOptions` (under `EVENT_OPTIONS`), read back by `EventPart`, and
 *  returns the same `handler` (no wrapper, no allocation per render). Call it once where the handler is created -
 *  a class field or a module constant - and bind the result plainly: `@click=${this.onClick}`.
 *
 *  The options belong to the handler itself, so every binding of that same function gets them. If the handler is
 *  already tagged with different options, a thin wrapper is returned instead so the earlier bindings keep theirs.
 *  Prefer `@click.once=${...}` (with `@std-ui/ext`) inside re-rendering templates. */
export function withEventOptions<H extends EventListenerOrEventListenerObject>(
	handler: H,
	options: AddEventListenerOptions,
): H & Required<WithOptions> {
	const existing = (handler as WithOptions)[EVENT_OPTIONS];
	// Untagged: tag in place, no wrapper. Already tagged with the same options (re-render): reuse as is.
	if (!existing) return Object.assign(handler, { [EVENT_OPTIONS]: options });
	if (sameOptions(existing, options)) return handler as H & Required<WithOptions>;
	// Already tagged with different options: tagging again would override the other bindings, so wrap.
	// `this` is forwarded for host-bound handlers.
	const wrapped = typeof handler === 'function'
		? function (this: unknown, event: Event) { return (handler as (this: unknown, e: Event) => unknown).call(this, event); }
		: { handleEvent: (event: Event) => handler.handleEvent(event) };
	return Object.assign(wrapped, { [EVENT_OPTIONS]: options }) as unknown as H & Required<WithOptions>;
}

/** The `addEventListener` options whose change requires removing and re-adding the listener. */
const LISTENER_OPTION_KEYS = ['capture', 'once', 'passive', 'signal'] as const satisfies readonly (keyof AddEventListenerOptions)[];

function sameOptions(a: AddEventListenerOptions | undefined, b: AddEventListenerOptions | undefined): boolean {
	return a === b || LISTENER_OPTION_KEYS.every(key => a?.[key] === b?.[key]);
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
	readonly #el: EventTarget;
	readonly #name: string;
	readonly #host: unknown;
	/** `el` is any `EventTarget` so `@listen()` can attach to `window`/`document`; templates pass elements. */
	constructor(el: EventTarget, name: string, modifiers: readonly Modifier[] = [], host?: unknown) {
		this.#el = el;
		this.#name = name;
		this.#host = host;
		warnIgnoredModifiers(`@${name}`, modifiers);
	}
	/** Extension hook: merges the handler's own `options` with any part-level options. */
	protected resolveOptions(own: AddEventListenerOptions | undefined): AddEventListenerOptions | undefined {
		return own;
	}
	/** Extension hook: runs before the handler (`listener` is the current one, e.g. to read tags off it);
	 *  return `false` to skip it (after any side effects). */
	protected shouldHandle(_event: Event, _listener: EventListenerOrEventListenerObject | undefined): boolean {
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
		const own = (listener as WithOptions)[EVENT_OPTIONS];
		const next = this.resolveOptions(typeof own === 'object' && own !== null ? own : undefined);
		// `once` means once per binding: after it fired, re-renders must not re-arm it. Dropping `once` re-enables it.
		if (this.#state === ListenerState.SPENT) {
			if (next?.once) return;
			this.#state = ListenerState.DETACHED;
		}
		const cur = this.#active;
		if (this.#state === ListenerState.ATTACHED && !sameOptions(cur, next)) {
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
		if (!this.shouldHandle(event, this.#listener)) return;

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
