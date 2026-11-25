// `@event(...)` - decorator for event handler methods, in two forms.
//
//   Attach: the decorator adds the listener on every connect and removes it on disconnect.
//     @event(ListenOn.window, 'resize', { passive: true })             onResize() {}
//     @event(ListenOn.host, 'keydown.ctrl+s', {}, { prevent: true })   onKey(e: KeyboardEvent) {}
//     @event(host => host.parentElement, 'scroll')                     onScroll() {}
//
//   Template-only: the method is just tagged with its `addEventListener` options and handler
//   filters, which `@name=${method}` picks up (needs the modifier-aware binding ext registers).
//     @event({ once: true }, { prevent: true })                 onSubmit(e: Event) {}   // `@submit=${this.onSubmit}`
//
// The attach form's event takes the template syntax (`keydown.ctrl+s`, `input.debounce:300`), so ext's
// event extensions work there too. Binding an attached method in a template as well is a DEV error.

import { addClassHooks, createClassRegistry, EVENT_OPTIONS, type UIElement, type UIElementHooks } from '@std-ui/core';

import { DEV } from '../../../dev/flag.js';
import { markAutoAttached, ModifierEventPart } from '../../template/custom-attributes/event/event.custom-attribute.js';
import { parseEventName, warnOnce, type EventFilters } from '../../template/custom-attributes/event/event-modifiers.js';

type Handler = (this: any, event: any) => unknown;
type EventDecorator = <T extends Handler>(method: T, context: ClassMethodDecoratorContext<UIElement>) => T;

/** Where an attached `@event()` listens: a function resolved on every connect (e.g. `host => host.parentElement`).
 *  A literal element is not accepted: the decorator runs once per class, not per instance. */
export type EventListenOn = (host: UIElement) => EventTarget | null | undefined;

/** Ready-made `EventListenOn`s. They are lazy, so referencing them never touches `window` while the class
 *  is defined; they resolve to `null` when the global is absent (e.g. SSR), which skips the listener. */
export const ListenOn = {
	host: (host: UIElement) => host,
	window: () => typeof window === 'undefined' ? null : window,
	document: () => typeof document === 'undefined' ? null : document,
} satisfies Record<string, EventListenOn>;

interface EventDef {
	on: EventListenOn;
	/** Event name, optionally with `.modifier` suffixes as in a template: `'keydown.ctrl+s'`. */
	eventName: string;
	options: AddEventListenerOptions;
	filters: EventFilters;
	method: Handler;
}

const eventRegistry = createClassRegistry<EventDef>('event');

const eventHooks: UIElementHooks = {
	connected(host) {
		const disposers: Array<() => void> = [];
		for (const { on, eventName, options, filters, method } of eventRegistry.get(host.constructor)) {
			const el = on(host);
			if (!el) continue;
			const { name, modifiers } = parseEventName(eventName);
			const part = new ModifierEventPart(el, { name, modifiers }, host);
			// A fresh wrapper: `method` itself is marked auto-attached and the part would reject it.
			part.update([Object.assign(function (this: unknown, e: Event) { return method.call(this, e); }, { [EVENT_OPTIONS]: options, filters })]);
			disposers.push(() => { part.dispose(); });
		}
		return () => disposers.forEach(dispose => dispose());
	},
};

/** Attaches the method as a listener while the element is connected. */
export function event(on: EventListenOn, eventName: string, options?: AddEventListenerOptions, filters?: EventFilters): EventDecorator;
/** Tags the method with options and filters for a template binding: `@name=${this.method}`. */
export function event(options?: AddEventListenerOptions, filters?: EventFilters): EventDecorator;
export function event(...args: unknown[]): EventDecorator {
	const attach = typeof args[0] === 'function';
	const [on, eventName, options = {}, filters = {}] = (attach ? args : [undefined, undefined, args[0], args[1]]) as
		[EventListenOn | undefined, string | undefined, AddEventListenerOptions | undefined, EventFilters | undefined];
	if (DEV) {
		// Misuse that would otherwise silently fall into the template-only form (the attach form is detected by `on` being a function).
		if (attach && typeof eventName !== 'string') {
			warnOnce('std-ui @event(): got a `listenOn` but no event name, so nothing is attached. Use @event(on, eventName, options?, filters?).');
		} else if (!attach && args[0] !== undefined && (typeof args[0] !== 'object' || args[0] === null)) {
			warnOnce(`std-ui @event(): the first argument must be a \`listenOn\` function (e.g. ListenOn.window) or an options object, got ${args[0] === null ? 'null' : typeof args[0]}; nothing is attached.`);
		}
	}
	return function eventDecorator(method, context) {
		if (context.kind !== 'method') throw new Error(DEV ? '@event() can only decorate a method.' : '@event(): methods only');
		if (!on || eventName === undefined) {
			// The decorator owns this method, so tagging it directly is safe.
			return Object.assign(method, { [EVENT_OPTIONS]: options, filters });
		}
		markAutoAttached(method);
		eventRegistry.register(context.metadata as object, { on, eventName, options, filters, method });
		addClassHooks(context.metadata as object, eventHooks); // once per class
		return method;
	};
}
