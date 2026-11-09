# `@state()` / `@attribute()` — shared internal design

How the two decorators share one field-wiring implementation, and where decorator-specific logic
lives. For API, see [`README.md`](./README.md), [`state/README.md`](./state/README.md), and
[`attribute/README.md`](./attribute/README.md).

## Module split

| File | Owns |
|---|---|
| [`field-store.ts`](./field-store.ts) | `applyFieldStore()` and `createStore()` — plain-field accessor + `signalState()` backing store. |
| [`state/`](./state/) | `@state()` — see [`state/design.md`](./state/design.md). |
| [`attribute/`](./attribute/) | `@attribute()` — see [`attribute/design.md`](./attribute/design.md). |
| [`index.ts`](./index.ts) | Public re-exports. |

[`../ui-element.ts`](../ui-element.ts) owns `tag()`, `attributeChangedCallback`, and
`connectedCallback` (which calls [`attribute/wire-reflect.ts`](./attribute/wire-reflect.ts)).

## Why `@attribute()` is built on `@state()`, not a copy of it

`@attribute()` is "everything `@state()` does, plus attribute registration/sync" — same
field-decorator mechanics, same complex-object (`SignalTree`) handling. Rather than duplicating,
`field-store.ts` exposes `applyFieldStore()`, with an optional `onInitialValue(initial)` hook:

- [`state()`](./state/state.decorator.ts) → `applyFieldStore(context)` (no hook).
- [`attribute()`](./attribute/attribute.decorator.ts) → registers `AttributeDef`, then
  `applyFieldStore(context, resolveInferredConverter)`.

Details: [`state/design.md`](./state/design.md), [`attribute/design.md`](./attribute/design.md).

## Plain fields only: `addInitializer` + `Object.defineProperty`

Both decorators only accept a **plain** field (`count = 0`, no `accessor`) — they throw if applied
to an `accessor` field. A plain field decorator (`context.kind === 'field'`) may only supply a
replacement initializer or register `addInitializer` — not a replacement `get`/`set` pair. So
`applyFieldStore()` does the following:

1. Leaves the field's own initializer untouched (`this.count = 0` — ordinary own data property).
2. Registers `context.addInitializer(fn)`, which runs with `this` bound to the instance immediately
   *after* the field is set.
3. `fn` reads the initial value, calls `createStore(initial)`, and `Object.defineProperty(this, key,
   { get })` — a read-only accessor returning the store.

Class field initializers use `[[DefineOwnProperty]]` on the instance and shadow any prototype
accessor, so the store accessor must redefine the **instance's own** property per instance.
(`accessor` fields could use decorator `get`/`set`, but supporting both duplicated logic in
`field-store.ts` for no current usage — see [`state/README.md`](./state/README.md#plain-fields-only).)

Decorated fields need *some* initializer (`useDefineForClassFields: true` in `tsconfig.json`); moot
for `@state()`/`@attribute()` since they always supply a default value.

## Where the store lives (no side table)

The store is closed over by the per-instance `get` from `Object.defineProperty` — no `WeakMap`, no
`this._count`. External code (`attributeChangedCallback`, reflection effects, templates) uses
`this[key]()` / `this[key].set(...)` like any other caller. Reads inside `effect()` track the store
transparently.

Stores exist before any lifecycle callback: construction and all field `addInitializer` callbacks
finish first (including attribute seeding at upgrade).

## Lifecycle summary

| Phase | Shared | `@state()` only | `@attribute()` only |
|---|---|---|---|
| Class eval | — | Optional context def | `AttributeDef` + `observedAttributes` via `tag()` |
| Instance create | `applyFieldStore()` → store | — | Converter inference hook if needed |
| Pre-connect | — | — | `attributeChangedCallback` from markup |
| `connectedCallback` | Render effect | — | Reflection effects if `reflect: true` |
| Store write | Notify subscribers | Render (+ context) | + reflection when applicable |

Attribute registration, callbacks, reflection, loop prevention, and inheritance:
[`attribute/design.md`](./attribute/design.md).

## Related reading

- [`README.md`](./README.md) — overview
- [`state/design.md`](./state/design.md) / [`attribute/design.md`](./attribute/design.md) — per-decorator design
- [`field-store.ts`](./field-store.ts) — implementation
- [`./context/design.md`](./context/design.md) — `contextKey` on `@state()`
- [`./query/design.md`](./query/design.md) — plain-field technique without a store
- [`../ui-element.ts`](../ui-element.ts) — lifecycle hooks
