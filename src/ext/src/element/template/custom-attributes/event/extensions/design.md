# Event extensions: design

## Shape

```ts
interface EventExtension {
	filter(info: { name; arg?; modifiers }): boolean;
	handler(handler: EventHandler, info): EventHandler;
}
type EventHandler = (event: Event) => void | (() => void);
```

`info` is core's `AttributeInfo` minus `sigil` (always `@`). The registry is a plain ordered
list in `event-extension.ts`.

## Flow

1. `ModifierEventPart` constructor calls `findEventExtension(info)`: first `filter` that passes wins,
   so exactly one extension per binding.
2. Built-in modifiers (`capture`, `prevent`, ...) are still parsed by the part. Unknown modifiers
   do not warn when an extension is chosen, since it may own them.
3. `part.handler = extension.handler(part.handler, info)`: the extension wraps the core handler
   (which calls the user's listener) and returns a replacement. Done once per part.
4. `EventPart.handleEvent` runs `shouldHandle` (built-in filters), then `this.handler(event)`.

## Dispose

The handler may return a function. `EventPart` keeps the latest one and runs it:

- before the next invocation (a new event supersedes the previous, like an effect cleanup);
- in `EventPart.dispose()`, which also detaches the listener.

So `debounce` is just "start a timer, return `clearTimeout`": no shared timer state, and the
pending call is cancelled on teardown. Trade-off: a user handler that returns a function by
accident gets it called as a dispose.

## Decisions and limits

- **First match, no composition.** `@keyup.debounce.ctrl+enter` uses only the first matching
  extension. Composing would need `filter` to select several and a defined wrap order.
- **Ordering matters.** Register specific extensions before broad ones.
- **Modifier claiming is coarse.** Any non-built-in modifier counts as claimed once an extension
  matches; a typo is silently ignored. A `claims(modifier)` method could tighten this.
- **`:arg`** reaches `filter`/`handler`; the binding no longer validates it. Without a match it
  warns once and is ignored.
