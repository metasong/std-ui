# `@state()` / `@attribute()` — reactive and attribute-backed component fields

Two field decorators for `UIElement` (see `../ui-element.ts`) subclasses, both backing a field with
a reactive store (see [`../signal/tree.md`](../signal/tree.md)):

| Decorator | Doc |
|---|---|
| **`@state()`** — reactive store only; no HTML attribute | [`state/README.md`](./state/README.md) |
| **`@attribute()`** — same store wiring, plus attribute parse/reflect via `observedAttributes` / `attributeChangedCallback` | [`attribute/README.md`](./attribute/README.md) |

`@attribute()` is built on the same field wiring as `@state()` ([`design.md`](./design.md)) — one
shared `applyFieldStore()` in [`field-store.ts`](./field-store.ts) — and only adds the
attribute-facing half (converters, metadata, reflection).

From outside the class (and in `template()`), a decorated field **is** its backing store: read with
`this.field()`, write with `this.field.set(value)` (or `.update()`).

```ts
import { tag, state, attribute, UIElement } from '../index.js';

@tag('user-badge')
class UserBadge extends UIElement {
	@attribute({ type: Number, reflect: true }) count = 0;
	@attribute() label = 'Guest';
	@state() internal = 'x';

	protected override template() {
		return t`<span>${this.label()}: ${this.count()}</span>`;
	}
}
```

```html
<user-badge count="3" label="Ada"></user-badge>
```

```js
const el = document.querySelector('user-badge');
el.count(); // 3 — parsed from the attribute at upgrade
el.count.set(4); // re-renders; with `reflect: true`, updates `count="4"`
el.setAttribute('count', '9'); // attributeChangedCallback → store
```

## Shared requirements

- **Plain fields only** — `@state() foo = 0` / `@attribute() foo = 0`, not `accessor`. Both throw
  otherwise; see [`design.md`](./design.md#plain-fields-only-addinitializer--objectdefineproperty).
- **`@tag()`** — required for custom elements that use `@attribute()` (sets `observedAttributes`).
  `@state()` alone does not register attributes; you still need `@tag()` to define the element.

Stacking `@state()` and `@attribute()` on the same field is allowed (one store) — see
[`field-store.ts`](./field-store.ts).

## Related reading

- [`./state/README.md`](./state/README.md) / [`./state/design.md`](./state/design.md) — `@state()` API and implementation.
- [`./attribute/README.md`](./attribute/README.md) / [`./attribute/design.md`](./attribute/design.md) — `@attribute()` API, converters, sync, reflection.
- [`./design.md`](./design.md) — shared `field-store` wiring and lifecycle overview.
- [`./context/README.md`](./context/README.md) / [`./context/design.md`](./context/design.md) — `@state({ contextKey })` / `@consume()`.
- [`./query/README.md`](./query/README.md) / [`./query/design.md`](./query/design.md) — `@query()` / `@queryAll()` / `@queryAsync()`.
- [`../ui-element.ts`](../ui-element.ts) / [`../doc/signal-drives-html.md`](../doc/signal-drives-html.md) — lifecycle.
- [`../signal/core/signal.md`](../signal/core/signal.md) — `signal()` / `effect()` primitives.
