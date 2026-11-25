# `@event` — event listener binding

Built-in **custom attribute** (sigil `@`, wildcard name) that attaches an event listener to an element.

```ts
import { t, withEventOptions } from '@std-ui/core';

t`<button @click=${onClick}>Save</button>`;
t`<button @click=${onceClick}>Once</button>`; // const onceClick = withEventOptions(onClick, { once: true })
```

## Behavior

- `@name=${handler}` registers `name` as the event type. The value may be a function or an
  `EventListenerObject` (`{ handleEvent }`).
- Inside a function handler, `this` is the template host (falls back to the element).
- `null` / `undefined` / non-callable values detach the listener.
- The `EventPart` itself is the single registered listener, so swapping handlers between renders
  does no remove/add.
- Takes no argument (`@click:foo` is rejected) and is single-valued (`single: true`).

## Listener options

`withEventOptions(handler, options)` tags a handler with `AddEventListenerOptions` (`capture`, `once`, `passive`, `signal`)
under the `EVENT_OPTIONS` symbol key (so a listener object's own `options` field is never misread) and returns **the same handler** (no wrapper).
Set it once where the handler is created (a class field) and bind it plainly. The options apply to every
binding of that function, so use one you own. Changing options between renders re-attaches the listener.

```ts
readonly onClick = withEventOptions(() => this.save(), { once: true });
t`<button @click=${this.onClick}>Once</button>`;
```

## Modifiers

The core part does not interpret modifiers (`@click.prevent`, `.once`, ...); they warn in DEV.
`@std-ui/ext` replaces this binding with one that handles them, using the protected hooks:

- `resolveOptions(own)` — merge the handler's own `options` with part-level options.
- `shouldHandle(event, listener)` — run side effects before the handler; return `false` to skip it.

## Files

- [`event-part.ts`](./event-part.ts) — `EventPart`, `withEventOptions()`.
- [`event.custom-attribute.ts`](./event.custom-attribute.ts) — registration (`eventExtension`).
- [`index.ts`](./index.ts) — exports.
