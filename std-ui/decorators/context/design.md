# `@state({ contextKey })` / `@consume()` — internal design

How provide/consume resolution actually works, and why it's built the way it is. For usage and
API, see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`key.ts`](./key.ts) | `ContextKey<T>`, `createContextKey()` — the branded, identity-compared, type-carrying key both sides link through. |
| [`metadata.ts`](./metadata.ts) | `ProvidedContextDef`/`ConsumedContextDef`, registering them into `context.metadata`, `getProvidedContextDefs`/`getConsumedContextDefs` — the context-protocol equivalent of `../attribute/metadata.ts`'s `AttributeDef` registry, same mechanism. |
| [`request-event.ts`](./request-event.ts) | `ContextRequestEvent`, `CONTEXT_REQUEST_EVENT` — the bubbling/composed DOM event both sides use to actually find each other at runtime. |
| [`consume.decorator.ts`](./consume.decorator.ts) | The `@consume()` decorator itself — registers a `ConsumedContextDef`; does no storage wiring (see below). |
| [`index.ts`](./index.ts) | Public re-exports, re-exported again from `../index.ts` / `../../component.ts`. |
| [`consume.test.ts`](./consume.test.ts) | Behavior tests, through `UIElement`/`tag()`. |

`@state({ contextKey })` itself (the provide side) is *not* in this folder - it's one extra branch
in [`../state/state.decorator.ts`](../state/state.decorator.ts), since providing context is just "an ordinary
`@state()` field, plus registering a `ProvidedContextDef`" - no new storage mechanics needed, so it
reuses `@state()`'s own `applyFieldStore()` call unchanged and only adds the registration call.

All the actual provide/consume runtime behavior - listening, dispatching, resolving, tearing down -
lives in [`../../component.ts`](../../component.ts)'s `connectedCallback`/`disconnectedCallback`,
for the same reason `@attribute()`'s reflection effects do: it needs a connected DOM tree to mean
anything, so it can't happen at decoration/construction time (see below).

## Why `@consume()` registers metadata but does *no* field/accessor wiring

Unlike `@state()`/`@attribute()` (see [`../design.md`](../design.md)), `@consume()` never calls
`applyFieldStore()` or returns a replacement `get`/`set`/initializer from the decorator itself. The
reason is simple: at decoration/construction time, **the field's value isn't known yet and can't
be** - it only exists on some ancestor, and which element is "the nearest ancestor" is a fact about
the live DOM tree, which doesn't exist until this element is connected. A field decorator runs once
per class declaration (and its `addInitializer`/`init` hooks run once per *instance construction*,
long before that instance is ever inserted anywhere) - there is no point during either of those
where "walk up and find a provider" is answerable.

So `@consume()` is deliberately thin: it only records `{ key, contextKey }` into
`context.metadata` (`registerConsumedContextDef`, mirroring `registerAttributeDef`/
`registerProvidedContextDef`) and returns nothing else. `UIElement.connectedCallback()` reads that
list back via `getConsumedContextDefs(this.constructor)` and does the real work *there*, once per
connect — see "Consume side" below.

### Why a plain field decorator, not an accessor one

`@consume()` only accepts `context.kind === 'field'` (throws otherwise) - same confinement
`@state()`/`@attribute()` apply (see [`../design.md`](../design.md#plain-fields-only-addinitializer--objectdefineproperty)),
but for an even more fundamental reason here: there's nothing for an `accessor` decorator to *do*.
Its whole point is to hand back a replacement `get`/`set` pair at decoration-time, but as
established above, there is no real value to back that pair with until connect-time - so
`connectedCallback` would have to redefine the property anyway, making the `accessor` keyword pure
noise (plus the opposite of its usual purpose: a consumed field is never locally written at all -
see "Read-only" below). A plain field needs no such pair; `connectedCallback` simply
`Object.defineProperty`s over the field's own (otherwise-`undefined`) own property, the same
mechanism `../field-store.ts` already uses for a `@state()`/`@attribute()` field.

## The wire protocol: `ContextRequestEvent`

Finding "the nearest ancestor providing `contextKey`" needs a live walk of the actual rendered
tree - which may include shadow-root boundaries - and needs to naturally prefer the closest match
when a descendant re-provides the same key (see "Nearest provider wins" below). Rather than writing
bespoke tree-walking code, this reuses a `bubbles: true, composed: true` DOM event, modeled on
`lit`'s own `context-request` protocol (same event name/shape) - because dispatching a bubbling
event *is* a tree walk, for free, implemented natively, that also transparently pierces shadow
roots (`composed: true`) the way a manual `parentElement`/`parentNode` loop would not.

```ts
export class ContextRequestEvent<T = unknown> extends Event {
	constructor(
		public readonly contextKey: ContextKey<T>,
		public readonly callback: (value: T) => void,
	) { super(CONTEXT_REQUEST_EVENT, { bubbles: true, composed: true, cancelable: true }); }
}
```

The requester dispatches one of these on itself; a provider's listener checks `event.contextKey`
by **identity** (not structurally - this is exactly why `ContextKey` exists rather than a string)
and, on a match, calls `event.stopPropagation()` then `event.callback(value)`.

## Provide side (`UIElement.connectedCallback()`)

Registered **before** the optional one-time `connect()` hook runs - not after, and not interleaved
with the attribute-reflection effects - specifically so that if `connect()` synchronously appends
descendant markup (a common pattern - see `../../component.ts`'s `connect()` doc), those
descendants' own `connectedCallback`s (which may dispatch `ContextRequestEvent`s) run *after* this
element can already answer them. Getting this ordering wrong is the one subtle failure mode here:
a descendant injected synchronously from `connect()` must never be able to observe its ancestor as
"not yet providing" the context it's about to provide.

For each `getProvidedContextDefs(this.constructor)` entry:

```ts
const listener = (event: Event): void => {
	const request = event as ContextRequestEvent<unknown>;
	if (request.contextKey !== def.contextKey) return; // identity check
	request.stopPropagation(); // "nearest provider wins" - see below
	this.#effectDisposers.push(createEffect(() => {
		request.callback(this[def.key]); // runs now, and again whenever this field's store changes
	}));
};
this.addEventListener(CONTEXT_REQUEST_EVENT, listener);
this.#contextListenerDisposers.push(() => this.removeEventListener(CONTEXT_REQUEST_EVENT, listener));
```

Each matching request gets its own `effect()` (not a single effect serving every past requester),
so each consumer is notified independently and exactly as often as the field's store actually
changes - same tracking primitive as `template()`/`.effect()` use elsewhere, just driven by
`request.callback` instead of a DOM write. These effects are disposed with everything else in
`disconnectedCallback`, via the same `#effectDisposers` list `@attribute({ reflect: true })`'s
effects and the render effect share.

The listener itself is tracked separately, in `#contextListenerDisposers`, and removed on
disconnect too - so a disconnected provider stops answering requests (including ones dispatched by
an element that gets reparented under a different provider later).

### Nearest provider wins

Because the request event bubbles from the requester upward, and a provider calls
`stopPropagation()` the instant its listener sees a matching request, the **first** (i.e.
**nearest**) ancestor providing that `contextKey` is the only one that ever responds - any
provider further up the tree never even sees the event. This is also exactly what makes
"re-providing" work for free: a descendant that itself provides the same `contextKey` is, by
definition, nearer to its own descendants than the original provider further up - no special-cased
override logic needed, just ordinary event bubbling semantics.

## Consume side (`UIElement.connectedCallback()`)

For each `getConsumedContextDefs(this.constructor)` entry, run *after* the provide-side listeners
above (so a self-providing element can answer its own descendants, and after the optional
`connect()` hook, so a consumer appended by some ancestor's `connect()` can resolve against
providers that registered earlier in this same tick):

```ts
const value = signal<unknown>(undefined);
let found = false;
this.dispatchEvent(new ContextRequestEvent(def.contextKey, next => {
	found = true;
	value.set(next);
}));
if (!found) throw new Error(/* ... */);
Object.defineProperty(this, def.key, {
	get() { return value(); },
	set() { throw new Error(/* read-only */); },
	enumerable: true,
	configurable: true,
});
```

`dispatchEvent` calls every matching listener **synchronously**, in bubbling order, before
returning - so by the time it returns, `found` already reflects whether some ancestor responded.
This is also why resolution can happen exactly once, synchronously, inside `connectedCallback`,
without needing to wait a microtask/frame: there is no async step in finding the nearest provider,
only in *reacting to it changing later* (handled by the provider's own `effect()`, which calls
`request.callback` again whenever its field's store notifies - that write flows straight into
`value.set(next)` above, which is itself a `signal`, so reading `this[def.key]` anywhere - inside
`template()`, inside another `effect()` - tracks it exactly like any other signal read).

**Read-only**: the `set` trap always throws. A consumed field's value is owned entirely by its
provider; there is deliberately no local write path - changing it means changing the provider's
own field (which then flows back down through the same mechanism to every consumer).

**No default-value escape hatch**: if `found` stays `false`, `connectedCallback` throws rather than
leaving the field `undefined` or falling back to some default. This is intentional: a silently
`undefined` context value is a worse failure mode (it defers the bug to wherever the value is
first read, with no clear message) than failing loudly, immediately, naming the field and the
expected context, right when the misconfiguration (missing provider somewhere up the tree)
actually happened.

Per the custom-elements spec, an exception thrown from `connectedCallback` is *reported* (e.g. to
`window.onerror`), not synchronously propagated to whatever call (`appendChild`, etc.) triggered
the connection - this is a platform behavior, not something this design controls, and is why
[`consume.test.ts`](./consume.test.ts) asserts on a `window.addEventListener('error', ...)` catch
rather than wrapping the triggering `appendChild()` in `expect().toThrow()`.

## Known limitation: a provider effect can outlive its consumer

Each provider-side `effect()` is created once, the first time a given request is answered, and
disposed only when the **provider** disconnects (via `#effectDisposers`) - not when the
**consumer** that dispatched that particular request disconnects first. If the consumer
disconnects before the provider does, that one `effect()` keeps calling a callback that writes into
a `signal()` nobody reads anymore - inert, but not reclaimed until the provider itself disconnects.
Acceptable for now (the closure is tiny, and most provider/consumer pairs disconnect together,
since the consumer is nested under the provider), but worth knowing if this ever needs tightening -
e.g. by having the callback itself detect "my value signal is no longer reachable" or by having the
consumer's `disconnectedCallback` dispatch a matching "unsubscribe" event the same way it dispatched
the original request.

## Lifecycle summary

| Phase | What happens |
|---|---|
| Class eval | `@state({ contextKey })` registers a `ProvidedContextDef`; `@consume()` registers a `ConsumedContextDef`. Neither creates any storage by itself. |
| Instance create | `@state()`'s own field wiring creates the provider field's store, exactly as it would with no `contextKey` at all. `@consume()` fields stay plain, unresolved own properties (`undefined`) until connect. |
| `connectedCallback` | Provider listeners registered (before `connect()`); `connect()` runs; consumer requests dispatched and resolved synchronously (throws if unanswered); consumed fields redefined as reactive read-only accessors. |
| Provider field write | Provider's own render/effects react, same as any `@state()` write; the context-serving `effect()` per past request also re-runs, flowing the new value into each consumer's own `signal()`. |
| `disconnectedCallback` | All effects (render, attribute-reflection, context-serving) disposed; provider's `context-request` listeners removed. |

## Related reading

- [`README.md`](./README.md) — public API and examples
- [`key.ts`](./key.ts) / [`metadata.ts`](./metadata.ts) / [`request-event.ts`](./request-event.ts) / [`consume.decorator.ts`](./consume.decorator.ts) — implementation
- [`../state/state.decorator.ts`](../state/state.decorator.ts) — the provide-side `contextKey` option
- [`../design.md`](../design.md) — `@state()`/`@attribute()`'s own field mechanics, which `@state({ contextKey })` reuses unchanged
- [`../../component.ts`](../../component.ts) — `connectedCallback`/`disconnectedCallback` wiring
- [`consume.test.ts`](./consume.test.ts) — behavior tests (resolution, reactivity, missing provider, read-only, nearest-provider-wins)
