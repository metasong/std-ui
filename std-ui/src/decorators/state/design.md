# `@state()` — internal design

How the `@state()` field decorator is implemented. For usage and API, see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`state.decorator.ts`](./state.decorator.ts) | `@state()` — plain-field guard, optional `contextKey` → `registerProvidedContextDef`, then `applyFieldStore()`. |
| [`state.test.ts`](./state.test.ts) | Behavior tests through `UIElement` / `tag()`. |

Shared with `@attribute()`:

| File | Role for `@state()` |
|---|---|
| [`../field-store.ts`](../field-store.ts) | `applyFieldStore()` + `createStore()` (`signalState()` for all initial shapes — see `createStore` JSDoc in that file). |
| [`../context/metadata.ts`](../context/metadata.ts) | `registerProvidedContextDef()` when `{ contextKey }` is passed. |

Complex-object behavior (`SignalTree` per plain-object initializer) is entirely in
[`../../signal/signal-state/main.ts`](../../signal/signal-state/main.ts) / [`../../signal/signal-state/README.md`](../../signal/signal-state/README.md) &
[`../../signal/signal-state/design.md`](../../signal/signal-state/design.md); both
decorators use the same `createStore()` path.

## What `state()` does at class-eval time

1. Throws unless `context.kind === 'field'` (plain field, no `accessor`).
2. If `options.contextKey` is set, pushes a provided-context def onto `context.metadata` (same
   accumulation pattern as `@attribute()`'s `AttributeDef` list — see
   [`../attribute/metadata.ts`](../attribute/metadata.ts)).
3. Calls `applyFieldStore(context)` with **no** `onInitialValue` hook.

`@state()` never writes attribute metadata and never appears in `observedAttributes` or reflection
effects.

## Per-instance wiring (`applyFieldStore`)

Full rationale: [`../design.md`](../design.md#plain-fields-only-addinitializer--objectdefineproperty)
and [`../design.md`](../design.md#where-the-store-lives-no-side-table).

1. Field initializer → own data property with the starting value.
2. `addInitializer` → `createStore(initial)` → `Object.defineProperty` read-only `get` returning the store.
3. Store closed over by the getter — external code uses `this[key]()` / `this[key].set(...)`.

`UIElement` lifecycle (and `@consume` readers) can assume the store exists before connect.

## Stacking with `@attribute()`

See [`../field-store.ts`](../field-store.ts) and [`../attribute/design.md`](../attribute/design.md#stacking-state-and-attribute).
`@state()` does not register `AttributeDef`; if stacked, `@attribute()` still does.

## Lifecycle (`@state()` slice)

| Phase | What happens |
|---|---|
| Class eval | Optional context provide def only. |
| Instance create | `applyFieldStore()` → store from initializer. |
| Connect / render | Reads in `template()` / `effect()` track the store. |
| Store write | Notify subscribers; render (+ context consumers if `contextKey`). |

Attribute upgrade seeding and reflection: [`../attribute/design.md`](../attribute/design.md).

Full combined lifecycle: [`../design.md`](../design.md#lifecycle-summary).

## Related reading

- [`README.md`](./README.md) — public API, complex-object fields, plain-field policy.
- [`state.decorator.ts`](./state.decorator.ts) — implementation.
- [`../design.md`](../design.md) — shared mechanics with `@attribute()`.
- [`../attribute/design.md`](../attribute/design.md) — attribute layer on the same wiring.
- [`../context/design.md`](../context/design.md) — `contextKey` provide/consume.
