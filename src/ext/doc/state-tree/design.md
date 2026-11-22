# Plain store fields - design

There is no `@stateTree()` decorator and no code in this folder: a reactive field of a `UIElement` is a
plain `stateTree(...)` class field. For usage, see [`README.md`](./README.md).

## Why there is no decorator

A field decorator can only return an initializer, call `context.addInitializer`, or register
metadata - it **cannot change the declared type** of the field it decorates. `@stateTree() count = 0` was
therefore still typed `number`, while the runtime value was a store, so `this.count()` and
`.set()` were IntelliSense errors. Making the field the store itself fixes the type at the source:
`StateTree<number>`.

That also removed the machinery that existed to swap a field for an accessor (`field-store.ts`:
`applyFieldStore()` / `createStore()`, the `addInitializer` + `Object.defineProperty` wiring, and the
`onInitialValue` hook `@attribute()` used for converter inference).

## What replaced each old responsibility

| Old responsibility | Now |
|---|---|
| Create the store from the initial value | The field initializer: `stateTree(initial)` |
| Per-instance store | Each instance runs the initializer, so each gets its own store |
| Plain objects / arrays become a signal tree | `stateTree()` itself ([`../../../reactive/state-tree/`](../../../reactive/state-tree/)) |
| `contextKey` on `@stateTree()` | `@provide(key)` / `defineElement({ provide })` - [`../context/design.md`](../context/design.md) |
| Attribute inference from the initial value | `resolveInferredConverter()` reads `this[key].peek()` on first use - [`../attribute/design.md`](../attribute/design.md) |

## Rules this implies

- The store must be created **per instance**: declare `stateTree(...)` in the class body, not at
  module level, unless sharing is intended.
- Writing goes through `.set()`. Template `.prop` bindings forward plain values into `.set()`
  (`PropertyPart`) rather than replacing the field.
- Registration decorators (`@attribute`, `@provide`) are typed to store fields only, so applying
  them to a plain value is a compile error.

## Related reading

- [`README.md`](./README.md) - usage.
- [`../design.md`](../design.md) - the shared registration mechanism.
- [`../../../reactive/state-tree/design.md`](../../../reactive/state-tree/design.md) - how `stateTree()` works.
