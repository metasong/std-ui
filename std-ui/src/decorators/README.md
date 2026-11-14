# Component fields — stores, attributes, context, queries

A `UIElement` (see `../ui-element.ts`) field is just a store — `count = state(0)` — so its
type (`SignalState<number>`) is correct from the declaration, with no decorator needed to wire it
(a decorator can never change a field's declared type, which is why `@state()` was removed).
Everything else is **opt-in registration**, available in two equivalent forms:

| Concern | Decorator (optional sugar) | Decorator-free |
|---|---|---|
| Reactive field | — | `readonly count = state(0)` |
| Define the element | `@tag('my-el')` | `defineElement('my-el', MyEl)` |
| Attribute ↔ store | `@attribute(opts)` on a store field | `defineElement(name, MyEl, { attributes: { count: opts } })` |
| Provide context | `@provide(key)` on a store field | `defineElement(name, Class, { provide: { field: key } })` |
| Consume context | `@consume(key)` on a `V` field (reads as the plain value) | `defineElement(name, Class, { consume: { field: key } })` |
| DOM queries | `@query()` / `@queryAll()` / `@queryAsync()` / `@queryAssignedNodes()` | `queryElement(this, sel)` / `queryElements` / `queryElementAsync` / `queryAssigned(this, opts)` (**prefer the decorators**) |

Both forms feed the same registries, so they can be mixed freely. Decorators need a TS/Babel build
step (browsers don't run them); the decorator-free form works with none.

```ts
import { UIElement, defineElement, createContextKey, queryElement, state, t } from '../index.js';

const ThemeKey = createContextKey<{ mode: string }>('theme');

class UserBadge extends UIElement {
	readonly count = state(0);                 // attribute-mirrored (see defineElement below)
	readonly label = state('Guest');
	readonly internal = state('x');            // plain store: no attribute
	readonly theme!: Theme;                          // read-only; filled in on connect (see defineElement below)
	get input() { return queryElement<HTMLInputElement>(this, 'input'); } // el.input, like `@query('input') input`

	protected override template() {
		return t`<span>${this.label()}: ${this.count()} (${this.theme.mode})</span><input />`;
	}
}
defineElement('user-badge', UserBadge, {
	attributes: { count: { type: Number, reflect: true }, label: {} },
	consume: { theme: ThemeKey },
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

`@consume(key)` decorates a field declared with the value's own type, `@consume(key) readonly theme!: Theme`,
and reads as the plain value (`this.theme.mode`, not `this.theme().mode`) - so a context whose value is
itself a signal or function isn't forced into `this.value()()`. The decorator registers a consumer and
defines the property as a read-only getter over it.

`@attribute()` and `@provide()` are typed to **store fields only** — applying them to a plain
value is a compile error, and `@provide(key)` additionally checks the store's value type against
the key's.

## Inheritance

Registrations are inherited: a subclass sees its base class's `@attribute` / `@provide` / `@consume` fields. With
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
- [`./context/README.md`](./context/README.md) - `@provide` / `@consume`.
- [`./tag/README.md`](./tag/README.md) - `@tag` / `defineElement`.
- [`./query/README.md`](./query/README.md) — queries.
- [`./state/README.md`](./state/README.md) — reactive store fields.
- [`./design.md`](./design.md) - how registration works internally (shared registry, metadata, inheritance).
- [`../signal/signal-state/README.md`](../signal/signal-state/README.md) — `state()`.
- [`../ui-element.ts`](../ui-element.ts) — lifecycle.
