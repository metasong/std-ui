# `@state()` — reactive store-backed component fields

Field decorator for `UIElement` (see `../../ui-element.ts`) subclasses that backs a class field with
a reactive store (`SignalState`, see [`../../signal/tree/README.md`](../../signal/tree/README.md)) — no HTML
attribute involved. Use [`../attribute/README.md`](../attribute/README.md) when the field should also
parse from / reflect to an attribute.

From outside the class (and in `template()`), the decorated field **is** its backing store: read
with `this.field()`, write with `this.field.set(value)` (or `.update()`). A primitive / array /
class-instance field behaves like a plain `signal()` reached through `SignalState`'s
`()` / `.peek()` / `.set()` / `.update()` surface.

For implementation details, see [`design.md`](./design.md). Shared field wiring with `@attribute()`:
[`../design.md`](../design.md#plain-fields-only-addinitializer--objectdefineproperty).

```ts
import { tag, state, UIElement } from '../../index.js';
import { t } from '../../template/index.js';

@tag('counter-chip')
class CounterChip extends UIElement {
	@state() count = 0;

	protected override template() {
		return t`<span>${this.count()}</span>`;
	}
}
```

```js
el.count(); // 0
el.count.set(3); // updates the store and schedules a re-render
```

## Requirements

- **Plain field only** — `@state() count = 0;`, not `accessor count = 0`. The decorator throws
  otherwise; see ["Plain fields only"](#plain-fields-only).
- **No `tag()` requirement for attributes** — `@state()` does not register `observedAttributes`. You
  still need `@tag()` to define the custom element when the class is used as one.

## Options

Most fields use no options:

```ts
@state() count = 0;
@state() config = { theme: 'dark' };
```

| Option | Effect |
|---|---|
| `contextKey` | Also expose this field's store to descendants via `@consume(contextKey)` — see [`../context/README.md`](../context/README.md). |

Use `@state()` for any field that should be reactive inside `template()` / `effect()` (triggering
re-renders) but should not be set from markup as an HTML attribute — internal UI state, working data,
etc.

Stacking `@state()` and `@attribute()` on the same field is allowed; see [`../field-store.ts`](../field-store.ts).

## Complex-object fields

A field whose value is a **plain object** (`{ ... }`) is backed by a full
[`SignalTree`](../../signal/tree/README.md) instead of a single flat `signal()` — every leaf gets its own
`Signal`, and reads flow through a `Computed` that only recomputes when a leaf touched by a write
changes:

```ts
class ConfigPanel extends UIElement {
	@state() config = { theme: 'dark', limits: { max: 10 } };

	protected override template() {
		return t`<span>${this.config().theme} / ${this.config().limits.max}</span>`;
	}
}

el.config.set({ ...el.config(), theme: 'light' }); // only `theme` notifies; `limits` keeps identity
```

Writing always takes a **whole** replacement object (`this.config.set({...})`, not a partial) —
`SignalState.set()` merges leaf-by-leaf so sibling leaves whose values did not change do not
spuriously notify readers.

The same tree backing applies to `@attribute()` complex fields when mirrored as JSON — see
[`../attribute/README.md`](../attribute/README.md#complex-object-fields).

## Reads and writes in templates and effects

- **`this.someField()`** inside `template()` or `this.effect()` tracks the field's store like any signal.
- **Writes** use `this.someField.set(value)` or `.update()`.
- Parent **`.prop` bindings** pass plain values; `PropertyPart` forwards them into `.set()` on the
  child's store.

`@state()` fields never get host attributes (see [`state.test.ts`](./state.test.ts)).

## Plain fields only

`@state()` only accepts a plain field (`count = 0`), not `accessor count = 0` — the decorator throws
otherwise. An earlier version supported `accessor` fields (stage-3 `get`/`set` from the decorator),
but nothing in this codebase used it, and dual support meant `field-store.ts` carried two parallel
implementations of the same behavior. Confining to plain fields removed that duplication; mechanics:
[`../design.md`](../design.md#plain-fields-only-addinitializer--objectdefineproperty).

`@attribute()` follows the same rule.

## Related reading

- [`./design.md`](./design.md) — `state.decorator.ts` and `applyFieldStore()` delegation.
- [`../attribute/README.md`](../attribute/README.md) — store plus attribute sync.
- [`../README.md`](../README.md) / [`../design.md`](../design.md) — shared overview.
- [`../context/README.md`](../context/README.md) — `contextKey`.
- [`../../ui-element.ts`](../../ui-element.ts) — render lifecycle.
