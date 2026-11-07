# `@state()` / `@attribute()` — reactive and attribute-backed component fields

Two field decorators for `UIElement` (see `../ui-element.ts`) subclasses, both backing a field with
a reactive store (a `SignalTree`, see [`../signal/tree.md`](../signal/tree.md)):

- **`@state()`** — just the reactive store. No attribute involved at all.
- **`@attribute()`** — everything `@state()` does, *plus* keeps the field in sync with an HTML
  attribute, using the platform's own custom-element monitoring mechanism (`observedAttributes` /
  `attributeChangedCallback`) - not a `MutationObserver` or polling. By default, sync is
  attribute -> property only; the opposite direction (property -> attribute) is opt-in via
  `reflect: true`, matching `lit`.

`@attribute()` is built on top of `@state()`'s own field wiring (see
[`design.md`](./design.md)) rather than duplicating it - so the two decorators always agree on how
a plain-value field vs. a complex-object field behaves; `@attribute()` just adds the
attribute-facing half on top.

A primitive/array/class-instance field behaves exactly as a plain `signal()`-backed one always did.
A **plain-object** field instead becomes a tree of signals/computeds mirroring its shape - see
["Complex-object fields"](#complex-object-fields) below. This is true for both decorators.

For implementation details, see [`design.md`](./design.md).

```ts
import { tag, state, attribute, UIElement } from '../index.js';

@tag('user-badge')
class UserBadge extends UIElement {
	@attribute({ type: Number, reflect: true }) count = 0; // mirrors the `count` attribute both ways
	@attribute() label = 'Guest'; // attribute -> property only (string, the default); JS writes don't reflect back
	@state() internal = 'x'; // store-backed only, no attribute at all

	protected override template() {
		return html`<span>${this.label}: ${this.count}</span>`;
	}
}
```

```html
<user-badge count="3" label="Ada"></user-badge>
```

```js
const el = document.querySelector('user-badge');
el.count; // 3 — parsed from the attribute at upgrade
el.count = 4; // writes the store, re-renders template(), and (because `reflect: true`) updates the `count="4"` attribute
el.setAttribute('count', '9'); // native attributeChangedCallback parses it back into the property
```

## Requirements

- Plain fields only (`@state() foo = 0;` / `@attribute() foo = 0;`) - no `accessor`. Both
  decorators throw if applied to an `accessor` field; see ["Plain fields
  only"](#plain-fields-only) below for why.
- For `@attribute()`, the class must also be decorated with `tag()` (see `../ui-element.ts`). `tag()`
  reads the `@attribute()` registrations made while the class body was evaluating and uses them to
  set `observedAttributes` before calling `customElements.define()`. `@state()` fields never
  register anything with `tag()` - they have no attribute concern.

## `@state()`

Takes no options - it's just "back this field with a reactive store":

```ts
@state() count = 0;
@state() config = { theme: 'dark' }; // SignalTree-backed, see below
```

Use `@state()` for any field that should be reactive (readable inside `template()`/`effect()`,
triggering re-renders) but has no business being an HTML attribute - internal UI state, derived
working data, anything not meant to be set from markup.

Stack `@state()` and `@attribute()` on the same field is allowed.

Pass `{ contextKey }` to additionally expose a `@state()` field to descendants (any depth), read
reactively via `@consume(contextKey)` - see [`context/README.md`](./context/README.md).

## `AttributeOptions` (for `@attribute()`)

| Option | Default | Effect |
|---|---|---|
| `name` | kebab-case of the field name | Attribute name to parse from/reflect to. This is what used to be `@property()`'s `attribute` option - there's no `false` case anymore: use `@state()` instead of `@attribute()` for a field that shouldn't touch an attribute at all. |
| `type` | inferred from the field's initial value | Selects the *default* attribute <-> property converter (see below). Ignored if `converter` is given. |
| `reflect` | `false` | Whether writing the property (from JS) also reflects back onto the attribute. When `false` (default, like `lit`), sync is attribute -> property only. |
| `converter` | — | Fully custom `{ fromAttribute, toAttribute }` pair, overriding `type`'s default - see below. |

## `type` conversions

`type` takes the constructor itself (`String`, `Number`, `Boolean`, `Object`, `Array`), matching
`lit`'s convention - it's a hint selecting a default converter, not a runtime `typeof` check. If
omitted (and no `converter` is given either), it's **inferred from the field's own initial value**
(`inferAttributeType()` in `./attribute/converter.ts`) once that value is known, at first-instance
construction time - so `@attribute() count = 0;` behaves exactly like `@attribute({ type: Number })
count = 0;` without spelling `type` out:

| Initial value | Inferred `type` |
|---|---|
| `number` (e.g. `0`) | `Number` |
| `boolean` (e.g. `false`) | `Boolean` |
| array (e.g. `[]`) | `Array` |
| plain object (e.g. `{}`) | `Object` |
| anything else (`string`, `null`, `undefined`, class instance, ...) | `String` |

| `type` | Attribute present | Attribute absent | Property -> attribute |
|---|---|---|---|
| `String` (fallback when nothing else is inferred) | the raw string | `''` | `setAttribute(name, String(value))`; `value == null` removes it |
| `Number` | `Number(value)` | `0` | `setAttribute(name, String(value))` |
| `Boolean` | `true` (regardless of the attribute's text, including `""`) | `false` | present (empty string) if truthy, removed if falsy - same convention as `?attr="${...}"` in `../template/html.md` |
| `Object` / `Array` | `JSON.parse(value)`, falling back to `{}` / `[]` if unparsable | `{}` / `[]` | `JSON.stringify(value)`; falls back to `''` (present, not removed) for a falsy value |

Pass `type` explicitly to override the inferred default - e.g. a field initialized to `null` would
otherwise infer `String`, so give it `type: Object` (or a custom `converter`) if it should actually
be treated as a complex-object field.

## Custom `converter`

For anything the five `type` defaults don't cover - a non-empty JSON fallback, a `Date`, a
validated enum, etc. - pass your own `converter`, exactly like `lit`:

```ts
@attribute({
	type: Object,
	reflect: true, // also mirror JS writes back onto the attribute
	converter: {
		// Attribute string -> property value
		fromAttribute: (value: string | null) => {
			try { return value ? JSON.parse(value) : { theme: 'dark' }; } catch { return { theme: 'dark' }; }
		},
		// Property value -> attribute text (return `null` to remove the attribute instead)
		toAttribute: (value: unknown) => (value ? JSON.stringify(value) : ''),
	},
})
config = { theme: 'dark' };
```

`type` is still worth passing alongside `converter` as a readability hint (it has no runtime effect
once `converter` is given).

## Complex-object fields

A `@state()`/`@attribute()` field whose value is a plain object (`{ ... }`) is backed by a full
[`SignalTree`](../signal/tree.md) instead of a single flat `signal()` - every leaf of the object gets
its own independently-writable `Signal`, and reads flow through a `Computed` that only recomputes
when a leaf actually touched by a write changes:

```ts
class ConfigPanel extends UIElement {
	@state() config = { theme: 'dark', limits: { max: 10 } };

	protected override template() {
		return html`<span>${this.config.theme} / ${this.config.limits.max}</span>`;
	}
}

el.config = { ...el.config, theme: 'light' }; // only the `theme` leaf notifies; `limits` keeps its identity
```

Writing the field always takes a **whole** replacement object (`this.config = {...}`, not a partial)
- internally this is passed to the tree's `.set()`, which treats a fully-specified object as a
complete (if leaf-by-leaf) merge, so sibling leaves whose value didn't change don't spuriously
notify their own readers just because the field as a whole was reassigned.

Use `@state()` if a complex-object field shouldn't touch the DOM attribute at all, or `@attribute()`
with `type: Object` (the default JSON converter - see above) if you do want it reflected to/from
the attribute as JSON text:

```ts
@attribute({ type: Object, reflect: true }) config = { theme: 'dark' };
```

```html
<config-panel config='{"theme":"light"}'></config-panel>
```

## How the two attribute directions work

- **Attribute -> property**: `tag()` computes `ctor.observedAttributes` from every
  `@attribute()`-registered attribute (own + inherited). The browser calls `UIElement`'s private
  `attributeChangedCallback` natively whenever one of those attributes is set, changed, or removed -
  including once per attribute already present in static markup, right when the element upgrades,
  *before* `connectedCallback`. That callback parses the new text per `type`/`converter` and calls
  `.set()` on the field's backing store.
- **Property -> attribute** (only for `@attribute({ reflect: true })` fields): in
  `connectedCallback`, `UIElement` sets up one `effect()` per reflecting `@attribute()` field that
  reads the field's store and calls `setAttribute`/`removeAttribute` with the serialized value - run
  once immediately (so the attribute reflects the current value right away) and again whenever the
  value changes. These effects are disposed on disconnect, like the render effect.
- **No infinite loop**: writing the same (re-serialized) text back via `setAttribute` inside the
  attribute -> property direction is harmless because the store only notifies when the value
  actually changes (`Object.is`) - so the property -> attribute effect simply doesn't re-run for a
  no-op write.
- **Reads inside `template()`**: a `@state()`/`@attribute()` field's getter reads its store, so
  using `this.someField` inside `template()` (or any `this.effect()`) tracks it like any other
  signal - the component re-renders when the field/attribute changes, same as reading any other
  signal would.

## Plain fields only

`@state()`/`@attribute()` only accept a plain field (`count = 0`), not an `accessor` field
(`accessor count = 0`) - the decorator throws otherwise. An earlier version supported both (an
`accessor` field can hand a decorator a `get`/`set` pair directly, which is arguably the more
"proper" stage-3 mechanism), but nothing in this codebase actually used it, and supporting it meant
`field-store.ts` carried two parallel implementations of the same "field becomes a store-backed
property" behavior for one API. Confining to plain fields cut that duplication; see
[`design.md`](./design.md#plain-fields-only-addinitializer--objectdefineproperty) for the mechanics
this relies on instead (and why a plain field needs *some* initializer, which `@state()`/
`@attribute()` always give it anyway).

## Related reading

- [`./design.md`](./design.md) — how registration, stores, and the two sync directions work internally.
- [`./context/README.md`](./context/README.md) / [`./context/design.md`](./context/design.md) — `@state({ contextKey })` / `@consume()`, passing a `@state()` field down to arbitrarily deep descendants.
- [`./query/README.md`](./query/README.md) / [`./query/design.md`](./query/design.md) — `@query()` / `@queryAll()` / `@queryAsync()`, read-only fields that query `renderRoot` (light DOM or shadow when `shadowRootOptions` is set); [why `@queryAsync()`](./query/README.md#why-queryasync-exists) when you need a node right after a signal write (waits on `UIElement.updateComplete`); [light vs shadow](./query/README.md#light-dom-vs-shadow-renderroot).
- [`../ui-element.ts`](../ui-element.ts) / [`../doc/signal-drives-html.md`](../doc/signal-drives-html.md) - `UIElement` lifecycle this plugs into.
- [`../signal/core/signal.md`](../signal/core/signal.md) - the `signal()`/`effect()` primitives backing this.
- [`../template/html.md`](../template/html.md) - the `?attr`/`.prop` binding conventions `type: Boolean` mirrors.
