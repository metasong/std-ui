# std-ui-ext

Optional add-ons for [`std-ui`](../std-ui/README.md), built only on std-ui's public extension points
(`registerUIElementHooks`, `createClassRegistry`, `ownMetadata`). `std-ui` has no knowledge of them.

| Extension | Import | Docs |
|---|---|---|
| Context: `@provide` / `@consume`, `createContextKey`, `defineContext` | `std-ui-ext` or `std-ui-ext/context` | [`src/element/decorators/context/README.md`](./src/element/decorators/context/README.md) - [design](./src/element/decorators/context/design.md) |

| Bindings: `class.name=${on}` and `style.prop=${value}` template attributes (Custom attributes) | `std-ui-ext` | [`src/element/template/bindings/class-style.ts`](./src/element/template/bindings/class-style.ts) - [grammar](../std-ui/src/element/template/compiler/compile-attributes.md#binding-name-grammar) |

Importing the package registers its lifecycle hooks with `UIElement` as a side effect, so import it
before any element that uses it connects.

The decorator-free form moved out of `defineElement`: use `defineContext(Class, { provide, consume })`
(before `defineElement`).
