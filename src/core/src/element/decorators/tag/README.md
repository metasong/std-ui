# `@tag()` / `defineElement()` — registering the custom element

Two equivalent ways to turn a `UIElement` subclass (see `../../ui-element.ts`) into a custom element.
Both do the same three things, in order: collect the class's registrations, set
`observedAttributes`, call `customElements.define()`.

```ts
// Decorator form (optional sugar)
@tag('user-badge')
class UserBadge extends UIElement {
	@attribute({ type: Number, reflect: true }) readonly count = stateTree(0);
}

// Decorator-free form: same registries, declared in one typed map
class UserBadge extends UIElement {
	readonly count = stateTree(0);
}
defineElement('user-badge', UserBadge, {
	attributes: { count: { type: Number, reflect: true } },
});
```

## `defineElement(name, Class, options?)`

| Option | Same as | Accepts |
|---|---|---|
| `attributes` | `@attribute(opts)` | store field name → `AttributeOptions` |

- Every map is **type-checked against the class**: `attributes` only lists store fields.
- It returns `Class`, so `export const X = defineElement(...)` works.
- Run it **after the class body**, so statics (`styles`, `shadowRootOptions`, ...) already exist.
- It registers per *class* (into the class's own metadata object, see
  `../class-registry.ts`); decorator registrations on the same class are merged, not replaced.
- **Subclasses inherit** their base class's `attributes` entries, as with
  decorators. Call `defineElement` for a **base class before its subclasses**: the subclass links to
  the base's registrations when it is first registered, so a base registered afterwards is not seen by
  a subclass that was already registered.

## `@tag(name)`

- Reads what the member decorators put into the class's `context.metadata` and sets
  `observedAttributes` from it. It must use `context.metadata` rather than `Class[Symbol.metadata]`,
  which is only assigned after class decorators have run.
- Then calls `customElements.define(name, Class)`.

## Why `observedAttributes` is set here

`customElements.define()` reads `observedAttributes` once, at define time. That is why attribute
registration has to happen before it, and why neither form can add attributes afterwards.

## Related reading

- [`../README.md`](../README.md) — all decorators and their decorator-free forms.
- [`../attribute/README.md`](../attribute/README.md) — attributes, converters, reflection.
- [`@std-ui/ext` context](../../../../../ext/src/decorators/context/README.md) - `@provide` / `@consume` (add-on package).
