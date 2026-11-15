# Component fields — stores, attributes, queries

A `UIElement` (see `../ui-element.ts`) field is just a store — `count = state(0)` — so its
type (`SignalState<number>`) is correct from the declaration, with no decorator needed to wire it
(a decorator can never change a field's declared type, which is why `@state()` was removed).
Everything else is **opt-in registration**, available in two equivalent forms:

| Concern | Decorator (optional sugar) | Decorator-free |
|---|---|---|
| Reactive field | — | `readonly count = state(0)` |
| Define the element | `@tag('my-el')` | `defineElement('my-el', MyEl)` |
| Attribute ↔ store | `@attribute(opts)` on a store field | `defineElement(name, MyEl, { attributes: { count: opts } })` |
| DOM queries | `@query()` / `@queryAll()` / `@queryAsync()` / `@queryAssignedNodes()` | `queryElement(this, sel)` / `queryElements` / `queryElementAsync` / `queryAssigned(this, opts)` (**prefer the decorators**) |

Both forms feed the same registries, so they can be mixed freely. Decorators need a TS/Babel build
step (browsers don't run them); the decorator-free form works with none.

```ts
import { UIElement, defineElement, queryElement, state, t } from '../index.js';

class UserBadge extends UIElement {
	readonly count = state(0);                 // attribute-mirrored (see defineElement below)
	readonly label = state('Guest');
	readonly internal = state('x');            // plain store: no attribute
	get input() { return queryElement<HTMLInputElement>(this, 'input'); } // el.input, like `@query('input') input`

	protected override template() {
		return t`<span>${this.label()}: ${this.count()}</span><input />`;
	}
}
defineElement('user-badge', UserBadge, {
	attributes: { count: { type: Number, reflect: true }, label: {} },
});
```

Same thing with decorators:

```ts
@tag('user-badge')
class UserBadge extends UIElement {
	@attribute({ type: Number, reflect: true }) readonly count = state(0);
	@attribute() readonly label = state('Guest');
	// ...
}
```

`@attribute()` is typed to **store fields only** - applying it to a plain value is a compile error.

## Inheritance

Registrations are inherited: a subclass sees its base class's `@attribute` fields. With
`defineElement`, call it for a **base class before its subclasses**.

## Rules

- **Plain fields only** — no `accessor`. Store fields are initialized in the field/constructor phase.
- **Prefer the `@query*()` decorators.** They read as plain properties (`el.input`) with no
  boilerplate. The decorator-free functions (`queryElement(host, sel)`, `queryElements`,
  `queryElementAsync`, `queryAssigned`) take the host as their first argument, run when called and
  return the result itself - what the matching `@query*()` property returns when read. A field
  initializer runs once, so it can't hold a live value; for property-style access wrap the call in a
  getter: `get input() { return queryElement(this, '#input'); }`.
- **Don't reuse a store across instances** — declare `state(...)` in the class body, not at
  module level, unless sharing is intended.
- **Per class, no state on `UIElement`** — `@attribute` / `@provide` / `@consume` (and the matching
  `defineElement` options) register per *class*; the query functions are plain functions taking the host.
  `UIElement` has no extra members and no field names are reserved.

## Related reading

- [`./attribute/README.md`](./attribute/README.md) — attributes, converters, reflection.
- [`std-ui-ext` context](../../../std-ui-ext/src/context/README.md) - `@provide` / `@consume` (add-on package).
- [`./tag/README.md`](./tag/README.md) - `@tag` / `defineElement`.
- [`./query/README.md`](./query/README.md) — queries.
- [`./state/README.md`](./state/README.md) — reactive store fields.
- [`./design.md`](./design.md) - how registration works internally (shared registry, metadata, inheritance).
- [`../signal/state/README.md`](../signal/state/README.md) — `state()`.
- [`../ui-element.ts`](../ui-element.ts) — lifecycle.
