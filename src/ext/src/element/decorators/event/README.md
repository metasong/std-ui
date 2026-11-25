# `@event()` decorator

Method decorator with two forms. Both are implemented in [`event.decorator.ts`](./event.decorator.ts) on top of
core's `EventPart` and the [`@event.modifier` binding](../../template/custom-attributes/event/README.md).

## Which way to attach a handler

| Way | Use when | Why it exists |
| --- | --- | --- |
| **1. Template binding with modifiers**<br>`@click.once.prevent=${this.onClick}` | The target is an element **in this template**, and the options are simple and fixed. This is the default. | The binding is the listener's lifecycle: it attaches when the element is rendered and detaches when it goes. Modifiers put the options next to the element they affect, and need no extra code. Modifiers need `@std-ui/ext`; core's binding ignores them (with a DEV warning). |
| **2a. Options carried by any handler**<br>`withEventOptions(fn, opts)` (core), bound plainly: `@click=${onClick}` | The handler is **not a class method** (a class field, a module-level function, an arrow function, `{ handleEvent }`), or you are on core without ext, and the options are more than a modifier chain should hold (`signal`, ...). | Works on **any** function or listener object. The options travel with the function, so templates stay clean and there is no per-render allocation. The cost is that they apply to **every** binding of that function (an already-tagged function with different options gets a wrapper instead). Use a function you own. It sets `AddEventListenerOptions` only; for filters use modifiers. |
| **2b. Options carried by a method**<br>`@event(opts, filters)` (ext, template-only form), bound plainly: `@click=${this.onClick}` | The handler is a **class method** and it needs fixed options and/or filters (`prevent`, `stop`, `self`) wherever it is bound. | Same idea as 2a, declared on the method itself, and it also carries **filters**. Methods only (it is a method decorator). Nothing is attached; the template binding still decides the element and event name. |
| **3. Attach decorator**<br>`@event(ListenOn.window, 'resize', opts)` | The target is **not in the template**: `window`, `document`, the host, or a computed element such as `host => host.parentElement`. | A template binding can only attach to an element the template renders. The decorator ties the listener to the **element's connect/disconnect** instead, so it is removed with the element, and `this` is the host. |

Rules of thumb:

- Listener on an element you render: 1; reach for 2 only when 1 is not enough.
- Listener on anything outside the template: 3.
- Never use 1 or 2 on a method that 3 attaches: it would register twice, so it is a DEV error.
- 2 is not a separate listener; it only adds options to a binding of kind 1.

Prefer 1 inside re-rendering templates: modifiers are parsed once per binding, while `withEventOptions(...)` written inline would re-tag a new function on every render.

## Attach form: `@event(on, eventName, options?, filters?)`

The element adds the listener on every connect and removes it on disconnect.

```ts
import { event, ListenOn } from '@std-ui/ext';

class MyEl extends UIElement {
	@event(ListenOn.window, 'resize', { passive: true })
	onResize() {}

	@event(ListenOn.host, 'keydown.ctrl+s', {}, { prevent: true })
	onKey(e: KeyboardEvent) {}

	@event(host => host.parentElement, 'scroll')
	onScroll() {}
}
```

- `on` is a function `(host) => EventTarget | null | undefined`, resolved on **every connect** (a literal element
  is not accepted: the decorator runs once per class, not per instance). A `null`/`undefined` result skips the listener.
- `on` is called **once per connect**: there is no equality check, no computed wrapper, and no tracking of signals it
  reads. Keep it stable for the duration of a connection (`host`, `window`, `document`, `host.parentElement`).
  Moving the element to a new parent normally fires disconnect then connect, so it re-resolves; a signal the function
  reads, or a target that only appears later (a `null` result), is **not** picked up until the next reconnect.
- `ListenOn.host`, `ListenOn.window` and `ListenOn.document` are ready-made; `window`/`document` resolve to `null`
  when the global is absent (SSR).
- `eventName` takes the template syntax, so `keydown.ctrl+s` and `input.debounce:300` work, and so do ext's event
  extensions.
- `options` are `addEventListener` options (`capture`, `once`, `passive`, `signal`); `filters` are
  `{ prevent, stop, 'stop-immediate', self }`. Both add to what the event-name modifiers produce, and win on conflict.
- `this` inside the method is the host element.

## Template-only form: `@event(options?, filters?)`

Tags the method with its options and filters; nothing is attached. A template binding picks them up.

```ts
@event({ once: true }, { prevent: true })
onSubmit(e: Event) {}

t`<form @submit=${this.onSubmit}></form>`;
```

The options are stored under core's `EVENT_OPTIONS` symbol and the filters under `filters`, read by
`ModifierEventPart` (needs the modifier-aware binding ext registers). Because the decorator owns the method, it
tags it directly.

## Lifecycle

| When | What happens |
| --- | --- |
| Class definition | The method is marked auto-attached, registered in the class's event registry, and the connect hook is added (once per class). |
| Connect | For each registration: resolve `on(host)`, create a `ModifierEventPart`, `update()` it with a fresh wrapper of the method (this calls `addEventListener`). |
| Disconnect | Each part is `dispose()`d: `removeEventListener`, plus any dispose function the handler returned. |

Reconnecting re-attaches with fresh parts.

## Rules and warnings

- Binding an attached method in a template as well is a **DEV error** (it would register twice). The wrapper in
  the connect hook exists so the decorator's own binding doesn't trip this check.

### The "already attached" throw

```ts
class MyEl extends UIElement {
	@event(ListenOn.window, 'resize')
	onResize() {}

	render() {
		return t`<div @click=${this.onResize}></div>`; // throws in DEV
	}
}
// std-ui @click: this handler is already attached by @event(); remove the template binding or the decorator's source.element.
```

- **What triggers it:** `ModifierEventPart.update()` receives a function that the attach-form decorator marked
  (`markAutoAttached`, a `WeakSet` keyed by the method). It does not matter which event the template binds
  (`@click`, `@resize`, ...) or which element it is on; any template binding of that method throws.
- **Why:** the decorator already owns a listener for the method, so a template binding would add a second one and
  the method would run twice, for two events or on two targets, and the two would not be reconciled.
- **When:** while the template updates, so at the first render that binds it, not when the class is defined.
- **DEV only.** The check is behind `DEV`; a production build skips it and both listeners are registered. Treat it
  as always wrong.
- **Not affected:** the template-only form `@event(options, filters)` (that is meant to be bound in a template), and
  plain methods bound in templates.
- **Fix:** keep one. Remove the template binding if the target is outside the template; remove the decorator's
  `on`/`eventName` (use the template-only form or a plain method) if the element is in the template. To reuse the
  logic in both places, call a shared function from two methods.
- Decorating anything but a method throws.
- DEV one-time warnings when the call would silently attach nothing: `@event(ListenOn.window)` (no event name), or a
  first argument that is neither a function nor an options object (e.g. `@event('resize')`).
