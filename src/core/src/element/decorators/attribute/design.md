# `@attribute()` - internal design

How attribute registration, conversion, and property <-> attribute sync are implemented. The field
itself is a plain `stateTree()` store and is never touched. For usage and API, see
[`README.md`](./README.md); for the registration mechanism shared with context, see
[`../design.md`](../design.md).

## Module split

| File | Owns |
|---|---|
| [`attribute.decorator.ts`](./attribute.decorator.ts) | `@attribute()`, `AttributeOptions` - builds an `AttributeDef` and registers it on `context.metadata`. |
| [`converter.ts`](./converter.ts) | `AttributeType` / `AttributeConverter`, default converters, `inferAttributeType`, `resolveConverter`, `parseAttribute` / `serializeAttribute`, `toAttributeName`. |
| [`metadata.ts`](./metadata.ts) | `AttributeDef`, `createAttributeDef`, the `attributeDefs` registry, `resolveInferredConverter`, `defineObservedAttributes`. |
| [`wire-reflect.ts`](./wire-reflect.ts) | `wireReflectedAttributes()` - connect-time reflection `effect()` per `reflect: true` def. |
| [`attribute.test.ts`](./attribute.test.ts) | Behavior tests through `UIElement` / `tag()`. |

[`../class-registry.ts`](../class-registry.ts) holds the shared registration store, and
[`../tag/`](../tag/) holds `@tag()` / `defineElement()`, which set `observedAttributes`.
[`../../ui-element.ts`](../../ui-element.ts) owns `attributeChangedCallback` (attribute -> property)
and calls `wireReflectedAttributes()` from `connectedCallback` (property -> attribute). It never
branches on `type` - only `parseAttribute` / `serializeAttribute` with each def's `converter`.

## Registering defs

`createAttributeDef(key, options)` is the one place that turns `AttributeOptions` into an
`AttributeDef` (`{ key, attribute, reflect, converter, infer? }`). Both entry points use it:

- `@attribute(opts)` -> `attributeDefs.register(context.metadata, def)`.
- `defineElement(name, Class, { attributes: { count: opts } })` ->
  `attributeDefs.register(ownMetadata(Class), def)`.

The decorator accepts any plain class field (a `stateTree()` store or a plain value) and never touches the field. `attributeDefs` is a
`ClassRegistry` (see [`../design.md`](../design.md#one-registry-per-kind-of-registration)): defs live
in an own array on the class's metadata object, inherited through the metadata prototype chain.

### Converter inference

With an explicit `type` or `converter`, the converter is resolved once, when the def is created. With
neither, the def gets a `String` placeholder and `infer: true`, and the real converter is resolved
lazily from the store's current value:

```ts
resolveInferredConverter(host, def) // def.converter = resolveConverter(inferAttributeType(host[def.key].peek()))
```

It runs the first time an instance needs the converter (`attributeChangedCallback` or
`wireReflectedAttributes`) and is a no-op afterwards. The def is shared by every instance, so the
first instance resolves it for all. The placeholder is enough for `observedAttributes`, which only
needs the attribute *name*.

## `converter.ts`

Pure functions and the default converter table - no decorator or DOM coupling. Boolean conversion is
**presence-based**, aligned with template `?attr`. Object/Array use JSON with empty
fallbacks; `toAttribute` returns `''` for falsy values so the attribute stays present.

## `observedAttributes`

`customElements.define()` reads `observedAttributes` once, so it is set just before:

- **`@tag(name)`** calls `defineObservedAttributes(ctor, context)`, which reads the defs through
  `attributeDefs.get(ctor, context.metadata)` - `ctor[Symbol.metadata]` isn't assigned yet while a class
  decorator runs (see [`../design.md`](../design.md#why-contextmetadata-not-ctorsymbolmetadata)).
- **`defineElement()`** registers its `attributes` map first, then calls
  `defineObservedAttributes(ctor)`, reading `ctor[Symbol.metadata]`.

Attribute names are de-duplicated across the class and its ancestors. A def with `reflect: false`
still counts (attribute -> property works); only reflection skips it.

## Attribute -> property: native callback

`UIElement` defines a private `attributeChangedCallback(name, oldValue, newValue)` (subclasses cannot
override it). It finds the def with `attribute === name` through `attributeDefs.get(this.constructor)`,
calls `resolveInferredConverter`, parses with `parseAttribute`, and writes `this[def.key].set(parsed)`
(skipping when `parsed === undefined`).

The browser invokes it for `setAttribute` / `removeAttribute`, and once per attribute already present
at **upgrade** (typically before `connectedCallback`), so static markup can override field defaults
(see [`attribute.test.ts`](./attribute.test.ts)). A custom `fromAttribute` may return `undefined` to
leave the store untouched; a custom `toAttribute` may return `undefined` to leave the host attribute
untouched.

## Property -> attribute: connect-time effects

Reflection is opt-in (`reflect: true`) and set up at **connect** time. `UIElement.connectedCallback`
calls [`wire-reflect.ts`](./wire-reflect.ts), which loops `attributeDefs.get(host.constructor)`, skips
`reflect: false`, resolves an inferred converter, and creates one `effect()` per def: read the store,
`serializeAttribute`, then `setAttribute` / `removeAttribute` (skipping when serialization is
`undefined`). Disposers go on the same list as the render effect and are torn down on
`disconnectedCallback`. The effect runs once immediately, so the host attribute matches the current
store value even if nothing was written after upgrade.

## Loop prevention

1. `setAttribute('count', '9')` -> `attributeChangedCallback` -> `store.set(9)`.
2. Reflection effect -> `serializeAttribute(9)` -> `setAttribute('count', '9')`.

Step 2 doesn't loop: `signal.set` no-ops when the value is unchanged (`Object.is`), so the reflection
effect doesn't re-run on a no-op write, and re-setting the same attribute text doesn't change the store.

## Inheritance

A subclass's `@attribute()` fields write only into the subclass's own metadata array. The metadata
object's prototype is the superclass's, so `attributeDefs.get()` sees subclass defs first, then
ancestors. `observedAttributes` is the de-duplicated union, and the single `attributeChangedCallback`
on `UIElement` handles every level. For `defineElement`, register a base class before its subclasses
(see [`../design.md`](../design.md#inheritance)).

## Combining with `@provide`

`@attribute()` and `@provide(key)` can sit on the same store field in either order: each only records
a def into its own registry and leaves the field untouched, so they never interfere (covered by
`stacked-decorators.test.ts`).

## Lifecycle (`@attribute()` slice)

| Phase | What happens |
|---|---|
| Class evaluation | `AttributeDef`s registered; `tag()` / `defineElement()` sets `observedAttributes`. |
| Instance creation | The field initializer creates the store; nothing else. |
| Upgrade / attribute change | `attributeChangedCallback` -> `.set()` on a store, or direct assignment on a plain field (resolving an inferred converter first). `isSignalLikeForAttribute()` in `metadata.ts` tells them apart; `reflect` on a plain field is skipped with a dev warning. |
| `connectedCallback` | `wireReflectedAttributes` for `reflect: true` only. |
| Store write | Render + reflection effects as applicable. |
| `disconnectedCallback` | Reflection effects disposed; reconnect repeats the connect setup. |

## Related reading

- [`README.md`](./README.md) - public API and examples.
- [`attribute.decorator.ts`](./attribute.decorator.ts) / [`converter.ts`](./converter.ts) / [`metadata.ts`](./metadata.ts) / [`wire-reflect.ts`](./wire-reflect.ts).
- [`../design.md`](../design.md) - the shared registration mechanism.
- [`../tag/README.md`](../tag/README.md) - `@tag` / `defineElement`.
- [`../../ui-element.ts`](../../ui-element.ts) - lifecycle hooks.
