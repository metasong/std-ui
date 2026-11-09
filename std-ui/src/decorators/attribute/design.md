# `@attribute()` — internal design

How attribute registration, conversion, and property ↔ attribute sync are implemented on top of the
same store-backed field wiring as `@state()`. For usage and API, see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`attribute.decorator.ts`](./attribute.decorator.ts) | `@attribute()`, `AttributeOptions` — converter resolution, `AttributeDef` registration, `applyFieldStore(..., resolveInferredConverter)`. |
| [`converter.ts`](./converter.ts) | `AttributeType` / `AttributeConverter`, default converters, `inferAttributeType`, `resolveConverter`, `parseAttribute` / `serializeAttribute`, `toAttributeName`. |
| [`metadata.ts`](./metadata.ts) | `AttributeDef`, `registerAttributeDef`, `getAttributeDefs`, `defineObservedAttributes` (`context.metadata` vs `Symbol.metadata`). |
| [`wire-reflect.ts`](./wire-reflect.ts) | `wireReflectedAttributes()` — connect-time reflection `effect()` per `reflect: true` def. |
| [`attribute.test.ts`](./attribute.test.ts) | Behavior tests through `UIElement` / `tag()`. |

Shared with `@state()`:

| File | Role for `@attribute()` |
|---|---|
| [`../field-store.ts`](../field-store.ts) | `applyFieldStore()` + `createStore()`; optional `onInitialValue` for converter inference. |

[`../../ui-element.ts`](../../ui-element.ts) owns `attributeChangedCallback` (attribute → property)
and calls `wireReflectedAttributes()` from `connectedCallback` (property → attribute). It never
branches on `type` — only `parseAttribute` / `serializeAttribute` with each def's `converter`.

`attribute.decorator.ts` resolves `options.converter` or a default from `options.type` at
class-definition time when explicit; otherwise registers a `String` placeholder on the shared
`AttributeDef` and patches `def.converter` in place after the first instance's initial value is known.

## Why build on `@state()` wiring

`@attribute()` is "store field + attribute surface". Duplicating `applyFieldStore()` would risk drift.
Instead:

1. Register `AttributeDef` on `context.metadata` (always, even if stacking makes field-store a no-op).
2. Call `applyFieldStore(context, resolveInferredConverter)` — same accessor installation as `@state()`.

`resolveInferredConverter`:

- At class eval with no `type`/`converter`: placeholder `String` converter on the def (for
  `observedAttributes`).
- On first instance init: `def.converter = resolveConverter(inferAttributeType(initial), undefined)` —
  same `def` object for all instances.

Explicit `options.type` or `options.converter` resolves once at decoration time — no per-instance patch.

See also [`../design.md`](../design.md#why-attribute-is-built-on-state-not-a-copy-of-it).

## `converter.ts`

Pure functions and default converter table — no decorator or DOM coupling. `UIElement` and
`wire-reflect.ts` call `parseAttribute` / `serializeAttribute`.

Boolean conversion is **presence-based**, aligned with template `?attr`. Object/Array use JSON with
lit-aligned empty fallbacks; `toAttribute` returns `''` for falsy values so the attribute stays present.

## Registering defs: `context.metadata` and `tag()`

Each `@attribute({ ... })` field pushes an `AttributeDef` onto `context.metadata` via
`registerAttributeDef` — the stage-3 shared object every member decorator accumulates into, so the
class decorator `tag()` can read registrations synchronously.

When **`@tag(tag)`** runs:

1. `defineObservedAttributes(ctor, context)` reads `context.metadata` (not `ctor[Symbol.metadata]`
   yet), walks its prototype chain (mirrors class hierarchy), dedupes attribute names.
2. Writes `ctor.observedAttributes`, then `customElements.define(tag, ctor)`.

`@state()` fields never register attribute defs. `@attribute()` fields with `reflect: false` still
get a def (attribute → property works); `connectedCallback` skips reflection effects for them.

### Why `context.metadata`, not `ctor[Symbol.metadata]`?

`context.metadata` is available to every decorator — including `tag()` — the instant it runs.
`ctor[Symbol.metadata]` is assigned only after the class is fully defined (after class decorators ran),
so `tag()` cannot read it during its own execution. `getAttributeDefs(ctor)` at runtime uses
`ctor[Symbol.metadata]`, which is populated by then.

Each def appends to an **own-property** array on `context.metadata` (`attrDefsKey`), avoiding mutation
of inherited arrays from the superclass metadata prototype.

## Attribute → property: native callback

`UIElement` defines a private `attributeChangedCallback(name, _oldValue, newValue)` (subclasses
cannot override it). It finds the `AttributeDef` whose `attribute === name` via
`getAttributeDefs(this.constructor)`, parses with `parseAttribute`, writes `this[def.key].set(parsed)`
(skipping when `parsed === undefined`).

The browser invokes this for `setAttribute` / `removeAttribute`, and for every attribute present at
**upgrade** (typically before `connectedCallback`) — static markup can override field defaults (see
[`attribute.test.ts`](./attribute.test.ts)).

Custom `fromAttribute` may return `undefined` to leave the store untouched.

## Property → attribute: connect-time effects

Reflection is opt-in (`reflect: true`), set up at **connect** time. `UIElement.connectedCallback`
delegates to [`wire-reflect.ts`](./wire-reflect.ts):

- Loop `getAttributeDefs`, skip `reflect: false`.
- One `effect()` per def: read store, `serializeAttribute`, `setAttribute` / `removeAttribute`.
- Disposers on the same list as the render effect; torn down on `disconnectedCallback`.

The effect runs synchronously on first subscribe, so the host attribute matches the current store
value even if no write happened after upgrade.

If `template()` reads `this.someField()`, a store change schedules reflection (for reflecting
`@attribute()` fields) and render — usual microtask batching for multiple writes in one turn.

## Loop prevention

Round trip:

1. `setAttribute('count', '9')` → `attributeChangedCallback` → `store.set(9)`.
2. Reflection effect → `serializeAttribute(9, …)` → `setAttribute('count', '9')`.

Step 2 does not loop: `signal.set` no-ops when unchanged (`Object.is`), so the reflection effect does
not re-run on a no-op write.

## Inheritance

Subclass `@attribute()` fields write only into the subclass's own `context.metadata` object. Per
spec, that object's prototype is the superclass's metadata — `collectAttributeDefs()` (walking
`Object.getPrototypeOf`) sees subclass defs first, then ancestors. `observedAttributes` on the
subclass is the deduped union of all attribute names from that merged list. One
`attributeChangedCallback` on `UIElement` handles every level.

## Stacking `@state()` and `@attribute()`

Decorators apply bottom-up. `applyFieldStore()` marks wired fields on `context.metadata`; the second
decorator skips double store install but `@attribute()` still registers `AttributeDef` and may run
`onInitialValue` for converter inference — see [`../field-store.ts`](../field-store.ts).

## Lifecycle (`@attribute()` slice)

| Phase | What happens |
|---|---|
| Class eval | `AttributeDef`(s) on `context.metadata`; `tag()` → `observedAttributes`. |
| Instance create | `applyFieldStore` (+ optional converter patch from initial value). |
| Upgrade / attr change | `attributeChangedCallback` → `.set()` on store. |
| `connectedCallback` | `wireReflectedAttributes` for `reflect: true` only. |
| Store write | Render + reflection effects as applicable. |
| `disconnectedCallback` | Reflection effects disposed; reconnect repeats connect setup. |

Full combined lifecycle: [`../design.md`](../design.md#lifecycle-summary).

## Related reading

- [`README.md`](./README.md) — public API and examples.
- [`attribute.decorator.ts`](./attribute.decorator.ts) / [`converter.ts`](./converter.ts) / [`metadata.ts`](./metadata.ts) / [`wire-reflect.ts`](./wire-reflect.ts).
- [`../design.md`](../design.md) — shared `field-store`, plain fields, where the store lives.
- [`../state/design.md`](../state/design.md) — the `@state()` half `@attribute()` delegates to.
- [`../../ui-element.ts`](../../ui-element.ts) — `tag()`, lifecycle hooks.
