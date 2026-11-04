# `@property()` — internal design

How attribute-backed component properties are implemented and why the module is split the way it
is. For usage and API, see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`converter.ts`](./converter.ts) | `PropertyType`/`PropertyConverter` types, the five default converters (`String`/`Number`/`Boolean`/`Object`/`Array`), `resolveConverter`, `parseAttribute`/`serializeAttribute`, `toAttributeName`. |
| [`metadata.ts`](./metadata.ts) | `PropertyDef`, registering defs into `context.metadata`, `getPropertyDefs`, `defineObservedAttributes`. |
| [`store.ts`](./store.ts) | `createStore` — picks the reactive store (`SignalTree`) backing a field's value. |
| [`decorator.ts`](./decorator.ts) | The `@property()` decorator itself and `PropertyOptions` — wires the three pieces above into the field's `get`/`set`. |
| [`index.ts`](./index.ts) | Public re-exports. |
| [`property.test.ts`](./property.test.ts) | Behavior tests, through `UIElement`/`element()`. |

Outside this folder, [`../component.ts`](../component.ts) owns the custom-element lifecycle hooks
(`attributeChangedCallback`, the reflection `effect()` in `connectedCallback`) that call into
`parseAttribute`/`serializeAttribute`/`getPropertyDefs`/`defineObservedAttributes`. Keeping
conversion logic in `converter.ts` means `UIElement` never branches on `type` itself — it only
passes `def.converter` into `parseAttribute`/`serializeAttribute`.

`decorator.ts` resolves `options.converter` (if given) or a default converter looked up from
`options.type` exactly once, at class-definition time, and stores the resolved `PropertyConverter`
on the `PropertyDef` — so per-instance code never re-derives it from `type`.

## Two field shapes: `accessor` and plain

`@property()` supports both an `accessor` field and a plain field. They end up equivalent
(`this.count` always resolves through the store), but get there by different decorator mechanics,
because the stage-3 decorators spec gives `accessor` and plain-field decorators different
capabilities.

### `accessor` fields: a class accessor decorator

For `accessor count = 0`, `@property()` runs as a **class accessor decorator**: it returns a
replacement `get`/`set` pair that delegate to a per-instance store, instead of storing the value on
the instance directly. The field initializer still runs once per instance; the decorator's
`init(value)` hook wraps that initializer's value, returning `createStore(value)` instead of the
raw value — that store, not the raw value, is what actually gets stored in the field's private
accessor slot. `get`/`set` then read/write *through* the store rather than returning/replacing it.

### Plain fields: `addInitializer` + `Object.defineProperty`

For `count = 0` (no `accessor`), `@property()` runs as a **class field decorator**, which has a
narrower contract: it may only supply a replacement initializer function or register an
`addInitializer` callback — it has no way to return a `get`/`set` pair, because a plain field has
no such slot to replace.

So `@property()` leans on field initializer semantics plus `addInitializer` timing instead:

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
once on the prototype (e.g. from `element()`) would simply be shadowed by every instance's own
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

## Registering defs: `context.metadata` and `element()`

Each `@property({ ... })` that isn't `attribute: false` pushes a `PropertyDef` onto
`context.metadata` (via `registerPropertyDef`, see `metadata.ts`) — a plain object the stage-3
decorators spec passes to **every** decorator applied to or within a class, specifically so a class
decorator can see what member decorators registered.

When **`@element(tag)`** runs (see `../component.ts`):

1. `defineObservedAttributes(ctor, context)` reads `context.metadata` directly (*not*
   `ctor[Symbol.metadata]` — see below) and walks its prototype chain, which the spec already sets
   up to mirror the class hierarchy — so inheritance falls out for free.
2. Unique attribute names from that merged list are written to `ctor.observedAttributes`, then
   `customElements.define(tag, ctor)` runs.

`customElements.define` reads `observedAttributes` once, at definition time — so step 2 must
complete before define.

Fields with `attribute: false` never write to `context.metadata`; they still get a store and
accessor wrapping, but don't appear in `observedAttributes` or reflection effects. Fields with
`reflect` left at its default (`false`) do get a def entry (so `attributeChangedCallback` still
parses the attribute into them), but `connectedCallback` skips the reflection `effect()` for them.

### Why `context.metadata`, not `ctor[Symbol.metadata]`?

`context.metadata` (the shared object already accumulated by every prior member decorator) is
available to every decorator on the class the instant it runs — including `element()`. By
contrast, `ctor[Symbol.metadata]` (that same object installed as a static property) is only
assigned "after the class has been fully defined" (tc39/proposal-decorator-metadata), which
includes class decorators having already run — so a class decorator can never see it populated
during its own execution. `element()` reads `context.metadata` for this reason; `getPropertyDefs(ctor)`
(used later at runtime) reads `ctor[Symbol.metadata]`, which by then is populated.

## Attribute → property: native callback

`UIElement` defines a private `attributeChangedCallback(name, _oldValue, newValue)` (subclasses
cannot override it). It finds the `PropertyDef` whose `attribute === name` via
`getPropertyDefs(this.constructor)`, and writes through the property:
`this[def.key] = parseAttribute(newValue, def.converter)` — the `@property()` accessor's `set` then
forwards it into the field's store.

The browser invokes this for `setAttribute`/`removeAttribute` calls, and for every attribute
already present on an element when it is **upgraded** (typically before `connectedCallback`) — so
static markup like `<user-badge count="3">` can override the field default before connect (see
[`property.test.ts`](./property.test.ts)).

A custom `converter` can return anything it wants from `fromAttribute`/`toAttribute`, including
`undefined` from `fromAttribute` to mean "leave the property untouched" — the `@property()`
accessor's `set` no-ops on an `undefined` write.

## Property → attribute: connect-time effects

Reflection is set up at **connect time**, not class-definition time, and is opt-in (`reflect:
true`), matching `lit`'s default. In `connectedCallback`, after optional one-time `connect()`,
`UIElement` loops `getPropertyDefs(this.constructor)`, skips any def with `reflect: false`, and
registers one `effect()` per remaining def that reads the property (`this[def.key]`), serializes it,
and calls `setAttribute`/`removeAttribute`. Effects are pushed onto the same disposer list as the
main render effect and disposed in `disconnectedCallback`.

The effect runs synchronously on first subscribe, so the host attribute is brought in line with the
current value even if no write happened after upgrade.

If `template()` reads `this.someProp`, a property change schedules both the reflection effect
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

Subclass `@property()` fields write only into the subclass's own `context.metadata` object. Per
spec, that object's prototype is set to the superclass's metadata object the moment the subclass is
declared — so `collectPropertyDefs()` (walking `Object.getPrototypeOf` in `metadata.ts`) sees the
subclass's own defs first, then every ancestor's, with no manual merging logic needed.
`observedAttributes` on the subclass is the deduped union of all reflected attribute names from
that merged list. A single `attributeChangedCallback` on `UIElement` handles every level.

## Lifecycle summary

| Phase | What happens for `@property()` |
|---|---|
| Class eval | Defs registered; `observedAttributes` set; custom element defined |
| Instance create | Field initializers + `addInitializer`/`init` create stores from initial values |
| Upgrade / attr set (pre-connect) | `attributeChangedCallback` may update stores from markup |
| `connectedCallback` | Reflection effects registered for `reflect: true` fields only; their attributes synced to current values |
| Store write | Notify subscribers; reflection + render effects as applicable |
| `disconnectedCallback` | All effects disposed; reconnect repeats connect setup |

## Related reading

- [`README.md`](./README.md) — public API and examples
- [`decorator.ts`](./decorator.ts) / [`converter.ts`](./converter.ts) / [`metadata.ts`](./metadata.ts) / [`store.ts`](./store.ts) — implementation
- [`../component.ts`](../component.ts) — `element()`, `connectedCallback`, `attributeChangedCallback`
- [`property.test.ts`](./property.test.ts) — behavior tests (upgrade seeding, booleans, `attribute: false`)
