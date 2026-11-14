# Component fields - shared internal design

How `@attribute`, `@provide`, `@consume`, `@tag` and `defineElement` share one registration
mechanism, and what stays out of `UIElement`. For the API, see [`README.md`](./README.md); each
folder has its own `README.md` and `design.md`.

## Principles

1. **A field is just a store.** `count = signalState(0)` is typed `SignalState<number>` from its
   declaration. A decorator can never change a field's declared type, so no decorator wraps or
   replaces a store (this is why `@state()` and `field-store.ts` were removed).
2. **Everything else is opt-in registration**: "this field mirrors an attribute / provides a context /
   consumes a context". Each registration exists in two equivalent forms - a decorator, and an entry
   in `defineElement`'s options (browsers don't run decorators) - and both feed the same registries.
3. **Registration is per class, never per instance.** Nothing is stored on `UIElement`, so it has no
   extra members and no field names are reserved.

## Module split

| File / folder | Owns |
|---|---|
| [`class-registry.ts`](./class-registry.ts) | `createClassRegistry()`, `ownMetadata()`, `metadataSymbol` - the registration store shared by the three registries below. |
| [`attribute/`](./attribute/) | `@attribute()`, converters, reflection - see [`attribute/design.md`](./attribute/design.md). |
| [`context/`](./context/) | `@provide()`, `@consume()`, the request event - see [`context/design.md`](./context/design.md). |
| [`tag/`](./tag/) | `@tag()` and `defineElement()` - see [`tag/README.md`](./tag/README.md). |
| [`query/`](./query/) | `@query*()` and the decorator-free query functions - see [`query/design.md`](./query/design.md). |
| [`state/`](./state/) | Docs only: plain `signalState()` fields (no code). |
| [`index.ts`](./index.ts) | Public re-exports. |

[`../ui-element.ts`](../ui-element.ts) owns `attributeChangedCallback` and `connectedCallback`, which
call the `wire*` functions of `attribute/` and `context/`.

## One registry per kind of registration

`createClassRegistry<D>(name)` returns `{ register(meta, def), get(ctor, meta?) }`. There are three
instances: `attributeDefs`, `providedContexts` and `consumedContexts`. Each keeps its defs in an array
stored under its own symbol on the class's **metadata object** (the stage-3 decorator metadata).

| Writer | Writes to |
|---|---|
| a decorator (`@attribute`, `@provide`, `@consume`) | `context.metadata` - the same object every decorator on the class receives |
| `defineElement(...)` | `ownMetadata(ctor)` - the class's own metadata object, created if the class has none |

| Reader | Reads |
|---|---|
| `UIElement` at runtime (`attributeChangedCallback`, `connectedCallback`) | `registry.get(ctor)` - reads `ctor[Symbol.metadata]` |
| `tag()` while its own decorator call is running | `registry.get(ctor, context.metadata)` - see below |

### Why `context.metadata`, not `ctor[Symbol.metadata]`

Every decorator on a class gets the *same* `context.metadata` object, accumulated as each member
decorator runs, so a class decorator can read what member decorators registered during its own call.
`ctor[Symbol.metadata]` is that same object installed as a static, but only *after* the class is fully
defined - after class decorators have already run. `tag()` therefore passes `context.metadata` to
`get()`; everything that runs later reads `ctor[Symbol.metadata]`.

### Inheritance

Per spec a subclass's metadata object has the superclass's metadata object as its **prototype**.
`get()` walks that prototype chain, collecting each level's own array (most-derived first), and
`register()` only pushes onto an *own* array so a subclass never mutates its parent's defs.

`ownMetadata(ctor)` builds the same shape for undecorated classes: it creates
`Object.create(parentMetadata)` once. It must create it - a subclass otherwise *inherits* its parent's
`Class[Symbol.metadata]` through the static chain, and registering onto that would leak into the
parent. Because the prototype link is made once, **register a base class with `defineElement` before
its subclasses** (decorators do this naturally). Creating metadata on every ancestor is deliberately
not done: it would reach native classes such as `HTMLElement`.

## Which decorators touch the field

| Decorator | At class evaluation | Per instance |
|---|---|---|
| `@attribute()` | records an `AttributeDef` | nothing - the field is left untouched |
| `@provide(key)` | records `{ key, contextKey }` | nothing - the field is the store |
| `@consume(key)` | records `{ key, contextKey }` | nothing until connect, when the property is defined |
| `@query*()` | nothing | `addInitializer` defines a read-only getter over the shared query function |

Decorated fields are plain (no `accessor`). A field with no initializer (`!:`) needs
`useDefineForClassFields: true` so the toolchain doesn't erase the field and its decorator - this
applies to `@consume` and `@query*`, not to `@attribute` / `@provide` (their fields always have an
initializer).

## Lifecycle summary

| Phase | What happens |
|---|---|
| Class evaluation | Decorators register into `context.metadata`; `@tag()` sets `observedAttributes` and calls `customElements.define()`. `defineElement()` registers into `ownMetadata(ctor)`, then does the same. |
| Instance creation | Field initializers create the stores (`signalState(...)`). |
| Upgrade / attribute change | `attributeChangedCallback` parses and `.set()`s the matching store. |
| `connectedCallback` | `wireProvidedContextListeners` -> `connect()` -> `wireReflectedAttributes` -> `wireConsumedContexts` -> render effect. |
| Store write | Render and reflection effects re-run (microtask-batched); context consumers update through their signal. |
| `disconnectedCallback` | Effects and context listeners are disposed; reconnecting repeats the connect steps. |

## Related reading

- [`README.md`](./README.md) - overview and the decorator / decorator-free table.
- [`attribute/design.md`](./attribute/design.md), [`context/design.md`](./context/design.md), [`query/design.md`](./query/design.md) - per-folder design.
- [`tag/README.md`](./tag/README.md) - `@tag` / `defineElement`.
- [`state/README.md`](./state/README.md) - plain store fields.
- [`../ui-element.ts`](../ui-element.ts) - lifecycle hooks.
