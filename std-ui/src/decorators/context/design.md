# `@provide()` / `@consume()` - internal design

How provide/consume resolution works, and why it's built this way. For usage and API, see
[`README.md`](./README.md); for the registration mechanism shared with attributes, see
[`../design.md`](../design.md).

## Module split

| File | Owns |
|---|---|
| [`key.ts`](./key.ts) | `ContextKey<T>`, `createContextKey()` - the branded, identity-compared, type-carrying key both sides link through. |
| [`metadata.ts`](./metadata.ts) | `ProvidedContextDef` / `ConsumedContextDef` and the `providedContexts` / `consumedContexts` registries (`ClassRegistry`, see [`../class-registry.ts`](../class-registry.ts)). |
| [`request-event.ts`](./request-event.ts) | `ContextRequestEvent`, `CONTEXT_REQUEST_EVENT` - the bubbling DOM event the two sides use to find each other. |
| [`provide.decorator.ts`](./provide.decorator.ts) | `@provide(key)` - registers a provider def. |
| [`consume.decorator.ts`](./consume.decorator.ts) | `@consume(key)` - registers a consumer def. |
| [`wire-provide.ts`](./wire-provide.ts) | `wireProvidedContextListeners()` - one `context-request` listener per provided store. |
| [`wire-consume.ts`](./wire-consume.ts) | `wireConsumedContexts()` - resolves each consumed field and defines its getter. |
| [`index.ts`](./index.ts) | Public re-exports. |
| [`consume.test.ts`](./consume.test.ts) | Behavior tests through `UIElement` / `tag()` / `defineElement()`. |

`UIElement.connectedCallback()` calls the two `wire*` functions; neither decorator wires anything
itself. Providing and consuming only mean something once the element is in a DOM tree, so they can't
happen at decoration or construction time.

## Registration is per class

Both sides record `{ key, contextKey }` per class, never per instance:

| Form | Provide | Consume |
|---|---|---|
| Decorator | `@provide(key)` -> `providedContexts.register(context.metadata, def)` | `@consume(key)` -> `consumedContexts.register(context.metadata, def)` |
| Decorator-free | `defineElement(..., { provide: { field: key } })` -> `register(ownMetadata(Class), def)` | `defineElement(..., { consume: { field: key } })` likewise |

`@provide` is typed to `SignalState<V>` fields (checked against the key's `V`) and leaves the field
untouched - the field *is* the store. `@consume` is typed to a plain `V` field; it only records its
def. Both are plain-field only (no `accessor`).

A consumer has no value at decoration or construction time - the nearest ancestor provider is a
fact about the live DOM - so `@consume` can't return an initializer or an accessor pair. The property
is defined at connect time instead (see below). `useDefineForClassFields` keeps a `!:` field from
being erased by the toolchain.

## The wire protocol: `ContextRequestEvent`

Finding "the nearest ancestor providing `contextKey`" needs a walk of the rendered tree, including
shadow-root boundaries, that prefers the closest match when a descendant re-provides the same key.
Instead of bespoke tree walking, a `bubbles: true, composed: true` DOM event (modeled on lit's
`context-request` protocol) does it natively:

```ts
export class ContextRequestEvent<T = unknown> extends Event {
	constructor(
		public readonly contextKey: ContextKey<T>,
		public readonly callback: (value: T) => void,
	) { super(CONTEXT_REQUEST_EVENT, { bubbles: true, composed: true, cancelable: true }); }
}
```

The requester dispatches one on itself; a provider's listener compares `event.contextKey` by
**identity** (which is why `ContextKey` exists rather than a string) and on a match calls
`event.stopPropagation()` then `event.callback(value)`.

## Provide side (`wire-provide.ts`)

Runs **before** the one-time `connect()` hook, so a descendant appended synchronously from
`connect()` can never see its ancestor as "not yet providing". For each
`providedContexts.get(host.constructor)` def, the store is read off the instance (`host[def.key]`) and
a listener is added:

```ts
const listener = (event: Event): void => {
	const request = event as ContextRequestEvent<unknown>;
	if (request.contextKey !== contextKey) return; // identity check
	request.stopPropagation(); // nearest provider wins
	registerEffectDisposer(createEffect(() => request.callback(readValue(store))));
};
host.addEventListener(CONTEXT_REQUEST_EVENT, listener);
```

Each matching request gets its own `effect()`, so every consumer is notified independently, and the
store's changes flow into each consumer's signal. The effect disposers and the listener disposers go
to `UIElement`'s own lists and are disposed on `disconnectedCallback`, so a disconnected provider stops
answering (including for an element later reparented under a different provider).

### Nearest provider wins

The request bubbles upward and a provider calls `stopPropagation()` the moment it sees a match, so the
**nearest** ancestor providing that key is the only one that ever responds. "Re-providing" falls out
for free: a descendant that provides the same key is nearer to its own descendants. No override logic.

## Consume side (`wire-consume.ts`)

Runs after the provide listeners and `connect()`. For each `consumedContexts.get(host.constructor)`
def:

```ts
const value = signal<unknown>(undefined);
let found = false;
host.dispatchEvent(new ContextRequestEvent(contextKey, next => { found = true; value.set(next); }));
if (!found) throw new Error(/* names the element and the key */);
Object.defineProperty(host, key, {
	get: () => value(),
	set() { throw new TypeError(/* read-only */); },
	enumerable: true,
	configurable: true,
});
```

- **Synchronous resolution.** `dispatchEvent` calls every matching listener, in bubbling order, before
  it returns, so `found` already says whether an ancestor responded. Resolution happens once, inside
  `connectedCallback`.
- **The signal lives in the getter's closure.** Nothing is kept per instance outside the property
  itself - no registry, no field on `UIElement`. Reading `this.theme` inside `template()` or `effect()`
  tracks the signal, so consumers re-render when the provider's store changes.
- **Plain-value reads.** The field is typed as the key's value (`Theme`), not as a signal, so a
  context whose value is itself a function or signal reads as `this.value`, not `this.value()()`.
- **Read-only.** The setter always throws a `TypeError` (instead of failing silently in sloppy mode, or
  with the engine's cryptic getter-only message). A consumed value is owned by its provider; changing it
  means changing the provider's store.
- **`undefined` until connect.** The `!:` field exists as `undefined` until `wireConsumedContexts`
  redefines it, which also redefines it on every reconnect.
- **No default-value escape hatch.** If nothing answers, `connectedCallback` throws instead of leaving
  the value `undefined`, because a silent `undefined` defers the bug to wherever the value is first
  read. Per the custom-elements spec the exception is *reported* (e.g. to `window.onerror`) rather than
  propagated to the `appendChild()` that triggered it, which is why `consume.test.ts` listens for the
  `error` event.

## Known limitation: a provider effect can outlive its consumer

Each provider-side `effect()` is created when a request is answered and disposed only when the
**provider** disconnects, not when the consumer does. If the consumer disconnects first, that effect
keeps writing into a signal nobody reads - inert but not reclaimed until the provider disconnects.
Acceptable for now (the closure is tiny and most pairs disconnect together); tightening it would need
the consumer to dispatch an "unsubscribe" event on disconnect.

## Lifecycle summary

| Phase | What happens |
|---|---|
| Class evaluation | `@provide` / `@consume` (or `defineElement`) register defs. Nothing is created. |
| Instance creation | The provider store is created by its field initializer; consumed fields are `undefined`. |
| `connectedCallback` | Provider listeners added; `connect()` runs; each consumed field is resolved synchronously (throws if unanswered) and defined as a read-only getter. |
| Provider store write | The provider's render/effects react; each per-request effect re-runs, updating the consumer's signal. |
| `disconnectedCallback` | Effects and provider listeners are disposed; the consumer's getter stays until the next connect redefines it. |

## Related reading

- [`README.md`](./README.md) - public API and examples.
- [`key.ts`](./key.ts) / [`metadata.ts`](./metadata.ts) / [`request-event.ts`](./request-event.ts) / [`wire-provide.ts`](./wire-provide.ts) / [`wire-consume.ts`](./wire-consume.ts) - implementation.
- [`../design.md`](../design.md) - the shared registration mechanism.
- [`../../ui-element.ts`](../../ui-element.ts) - `connectedCallback` / `disconnectedCallback` wiring.
- [`consume.test.ts`](./consume.test.ts) - behavior tests (resolution, reactivity, missing provider, read-only, nearest-provider-wins, inheritance).
