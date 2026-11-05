# `@state()` / `@attribute()` — internal design

How the reactive-field decorator (`@state()`) and the attribute-syncing decorator (`@attribute()`)
built on top of it are implemented, and why the module is split the way it is. For usage and API,
see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`field-store.ts`](./field-store.ts) | `applyFieldStore()` — the shared accessor/plain-field decorator mechanics (store-backed `get`/`set`/`init`) that both `@state()` and `@attribute()` delegate to. This is the one piece of logic they share, so neither re-implements it. |
| [`store.ts`](./store.ts) | `createStore` — picks the reactive store (`SignalTree`) backing a field's value. |
| [`state.ts`](./state.ts) | The `@state()` decorator itself — just wires a field to `applyFieldStore()`, no attribute concern at all. |
| [`converter.ts`](./converter.ts) | `AttributeType`/`AttributeConverter` types, the five default converters (`String`/`Number`/`Boolean`/`Object`/`Array`), `resolveConverter`, `parseAttribute`/`serializeAttribute`, `toAttributeName`. Only `@attribute()` uses this. |
| [`metadata.ts`](./metadata.ts) | `AttributeDef`, registering defs into `context.metadata`, `getAttributeDefs`, `defineObservedAttributes`. Only `@attribute()` fields register here. |
| [`attribute.ts`](./attribute.ts) | The `@attribute()` decorator and `AttributeOptions` — resolves `converter`/`type`, registers the `AttributeDef`, then delegates the actual field/accessor wiring to `field-store.ts`'s `applyFieldStore()` (the same function `@state()` calls), passing a hook that resolves the type-inferred converter once the initial value is known. |
| [`index.ts`](./index.ts) | Public re-exports. |
| [`state.test.ts`](./state.test.ts) / [`attribute.test.ts`](./attribute.test.ts) | Behavior tests, through `UIElement`/`tag()`. |

Outside this folder, [`../component.ts`](../component.ts) owns the custom-element lifecycle hooks
(`attributeChangedCallback`, the reflection `effect()` in `connectedCallback`) that call into
`parseAttribute`/`serializeAttribute`/`getAttributeDefs`/`defineObservedAttributes`. Keeping
conversion logic in `converter.ts` means `UIElement` never branches on `type` itself — it only
passes `def.converter` into `parseAttribute`/`serializeAttribute`.

`attribute.ts` resolves `options.converter` (if given) or a default converter looked up from
`options.type` exactly once, at class-definition time, and stores the resolved `AttributeConverter`
on the `AttributeDef` — so per-instance code never re-derives it from `type`.

## Why `@attribute()` is built on top of `@state()`, not a copy of it

`@attribute()` is "everything `@state()` does, plus attribute registration/sync" - every field it
decorates is store-backed exactly the way a `@state()` field is, with the same accessor/plain-field
mechanics, the same complex-object (`SignalTree`) handling, the same `undefined`-write no-op
convention. Rather than duplicating that logic in both decorators (and risking them drifting apart),
`field-store.ts` extracts it into one function, `applyFieldStore()`, parameterized by an optional
`onInitialValue(initial)` hook:

- `state()` calls `applyFieldStore(target, context)` - no hook, nothing attribute-related.
- `attribute()` calls `applyFieldStore(target, context, resolveInferredConverter)` - same wiring,
  plus a hook that resolves the type-inferred converter (see below) once the field's initial value
  is known, and (before calling `applyFieldStore()` at all) registers an `AttributeDef` so `tag()`/
  `UIElement` know this field has an attribute to sync.

So the "field becomes reactive" concern lives in exactly one place, and `attribute.ts` only adds
what's actually new: `AttributeOptions` handling, converter resolution, and `AttributeDef`
registration.

Stacking `@state()` and `@attribute()` on one field isn't an error
## Two field shapes: `accessor` and plain

Both decorators support an `accessor` field and a plain field. They end up equivalent
(`this.count` always resolves through the store), but get there by different decorator mechanics,
because the stage-3 decorators spec gives `accessor` and plain-field decorators different
capabilities. This is all handled once, in `field-store.ts`'s `applyFieldStore()`.

### `accessor` fields: a class accessor decorator

For `accessor count = 0`, the decorator runs as a **class accessor decorator**: it returns a
replacement `get`/`set` pair that delegate to a per-instance store, instead of storing the value on
the instance directly. The field initializer still runs once per instance; the decorator's
`init(value)` hook wraps that initializer's value, returning `createStore(value)` instead of the
raw value — that store, not the raw value, is what actually gets stored in the field's private
accessor slot. `get`/`set` then read/write *through* the store rather than returning/replacing it.

### Plain fields: `addInitializer` + `Object.defineProperty`

For `count = 0` (no `accessor`), the decorator runs as a **class field decorator**, which has a
narrower contract: it may only supply a replacement initializer function or register an
`addInitializer` callback — it has no way to return a `get`/`set` pair, because a plain field has
no such slot to replace.

So `applyFieldStore()` leans on field initializer semantics plus `addInitializer` timing instead:

1. It leaves the field's own initializer untouched, so `this.count = 0` runs exactly like it would
   with no decorator at all — an ordinary own data property.
2. It calls `context.addInitializer(fn)`. Per spec, for a field decorator this runs with `this`
   bound to the instance, immediately *after* this field has been set.
3. `fn` reads that initial value, creates `createStore(initial)`, and immediately calls
   `Object.defineProperty(this, key, { get, set })` — redefining the very same own property with an
   accessor backed by the store, before the constructor can run any later code.

A plain field can't delegate through a prototype `get`/`set` the way an `accessor` field can: class
field initializers always use `[[DefineOwnProperty]]` ("define" semantics) directly onto the
instance, never `[[Set]]`, regardless of what's on the prototype chain — so an accessor installed
once on the prototype (e.g. from `tag()`) would simply be shadowed by every instance's own
field initializer. Redefining the *instance's own* property, per instance, right after that
instance's data property was created, avoids this entirely.

## Where the store lives (no side table)

Per-instance state (the store itself) is not kept in a module-level `WeakMap`/`Map`, and not stored
as a separate public property. For an `accessor` field, it lives in the private storage slot the
`accessor` keyword already allocates per field per instance. For a plain field, it's closed over by
the `get`/`set` pair `Object.defineProperty` installs on that instance's own property. Either way,
code outside this folder — `UIElement`'s `attributeChangedCallback` and its reflection `effect()` —
just reads/writes the property the normal way (`this[def.key]`), exactly like any other caller; the
decorator's `get`/`set` does the store dereference internally, including **tracking**: reading
`this[def.key]` from inside an `effect()` tracks the field's store transparently.

`attributeChangedCallback` and the reflection effect can safely assume the store already exists
whenever they run (even for attributes present at upgrade, before `connectedCallback`): a custom
element's constructor — including every field's `init()`/`addInitializer` — always finishes running
before any lifecycle callback can fire.

## Registering defs: `context.metadata` and `tag()`

Each `@attribute({ ... })` field pushes an `AttributeDef` onto `context.metadata` (via
`registerAttributeDef`, see `metadata.ts`) — a plain object the stage-3 decorators spec passes to
**every** decorator applied to or within a class, specifically so a class decorator can see what
member decorators registered. `@state()` fields never do this - they have nothing for a class
decorator to read.

When **`@tag(tag)`** runs (see `../component.ts`):

1. `defineObservedAttributes(ctor, context)` reads `context.metadata` directly (*not*
   `ctor[Symbol.metadata]` — see below) and walks its prototype chain, which the spec already sets
   up to mirror the class hierarchy — so inheritance falls out for free.
2. Unique attribute names from that merged list are written to `ctor.observedAttributes`, then
   `customElements.define(tag, ctor)` runs.

`customElements.define` reads `observedAttributes` once, at definition time — so step 2 must
complete before define.

`@state()` fields never write to `context.metadata`; they still get a store and accessor wrapping,
but never appear in `observedAttributes` or reflection effects. `@attribute()` fields with
`reflect` left at its default (`false`) do get a def entry (so `attributeChangedCallback` still
parses the attribute into them), but `connectedCallback` skips the reflection `effect()` for them.

### Why `context.metadata`, not `ctor[Symbol.metadata]`?

`context.metadata` (the shared object already accumulated by every prior member decorator) is
available to every decorator on the class the instant it runs — including `tag()`. By
contrast, `ctor[Symbol.metadata]` (that same object installed as a static property) is only
assigned "after the class has been fully defined" (tc39/proposal-decorator-metadata), which
includes class decorators having already run — so a class decorator can never see it populated
during its own execution. `tag()` reads `context.metadata` for this reason; `getAttributeDefs(ctor)`
(used later at runtime) reads `ctor[Symbol.metadata]`, which by then is populated.

## Attribute → property: native callback

`UIElement` defines a private `attributeChangedCallback(name, _oldValue, newValue)` (subclasses
cannot override it). It finds the `AttributeDef` whose `attribute === name` via
`getAttributeDefs(this.constructor)`, and writes through the property:
`this[def.key] = parseAttribute(newValue, def.converter)` — the `@attribute()` accessor's `set`
then forwards it into the field's store.

The browser invokes this for `setAttribute`/`removeAttribute` calls, and for every attribute
already present on an element when it is **upgraded** (typically before `connectedCallback`) — so
static markup like `<user-badge count="3">` can override the field default before connect (see
[`attribute.test.ts`](./attribute.test.ts)).

A custom `converter` can return anything it wants from `fromAttribute`/`toAttribute`, including
`undefined` from `fromAttribute` to mean "leave the property untouched" — `applyFieldStore()`'s
`set` no-ops on an `undefined` write (shared by both decorators, though only `@attribute()`'s
converters ever produce `undefined`).

## Property → attribute: connect-time effects

Reflection is set up at **connect time**, not class-definition time, and is opt-in (`reflect:
true`), matching `lit`'s default. In `connectedCallback`, after optional one-time `connect()`,
`UIElement` loops `getAttributeDefs(this.constructor)`, skips any def with `reflect: false`, and
registers one `effect()` per remaining def that reads the property (`this[def.key]`), serializes it,
and calls `setAttribute`/`removeAttribute`. Effects are pushed onto the same disposer list as the
main render effect and disposed in `disconnectedCallback`.

The effect runs synchronously on first subscribe, so the host attribute is brought in line with the
current value even if no write happened after upgrade.

If `template()` reads `this.someField`, a property change schedules both the reflection effect
(attribute update) and the render effect — subject to the usual microtask batching for multiple
writes in one turn.

## Loop prevention

A full round trip looks like:

1. `setAttribute('count', '9')` → `attributeChangedCallback` → `store.set(9)`.
2. Reflection effect runs → `serializeAttribute(9, numberConverter)` → `setAttribute('count', '9')`.

Step 2 does not cause an infinite loop because the store's underlying `signal.set` no-ops (no
notify) when the value is unchanged (`Object.is`) — so the reflection effect does not re-run unless
the value actually changed.

## Inheritance

Subclass `@attribute()` fields write only into the subclass's own `context.metadata` object. Per
spec, that object's prototype is set to the superclass's metadata object the moment the subclass is
declared — so `collectAttributeDefs()` (walking `Object.getPrototypeOf` in `metadata.ts`) sees the
subclass's own defs first, then every ancestor's, with no manual merging logic needed.
`observedAttributes` on the subclass is the deduped union of all reflected attribute names from
that merged list. A single `attributeChangedCallback` on `UIElement` handles every level.

## Lifecycle summary

| Phase | What happens |
|---|---|
| Class eval | `@attribute()` defs registered; `observedAttributes` set; custom element defined. `@state()` fields register nothing. |
| Instance create | Field initializers + `addInitializer`/`init` (via `applyFieldStore()`) create stores from initial values, for both `@state()` and `@attribute()` fields |
| Upgrade / attr set (pre-connect) | `attributeChangedCallback` may update `@attribute()` fields' stores from markup |
| `connectedCallback` | Reflection effects registered for `@attribute({ reflect: true })` fields only; their attributes synced to current values |
| Store write | Notify subscribers; reflection (for `@attribute()`) + render effects as applicable |
| `disconnectedCallback` | All effects disposed; reconnect repeats connect setup |

## Related reading

- [`README.md`](./README.md) — public API and examples
- [`field-store.ts`](./field-store.ts) / [`state.ts`](./state.ts) / [`attribute.ts`](./attribute.ts) / [`converter.ts`](./converter.ts) / [`metadata.ts`](./metadata.ts) / [`store.ts`](./store.ts) — implementation
- [`../component.ts`](../component.ts) — `tag()`, `connectedCallback`, `attributeChangedCallback`
- [`state.test.ts`](./state.test.ts) / [`attribute.test.ts`](./attribute.test.ts) — behavior tests (upgrade seeding, booleans, store-only fields)
