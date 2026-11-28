# `@attribute()` — attribute-synced, store-backed component fields

Field decorator for `UIElement` (see `../../ui-element.ts`) subclasses: it marks a field - a `store()` store or a plain field - so it is also
kept in sync with an HTML attribute via the platform's custom-element mechanism
(`observedAttributes` / `attributeChangedCallback`) — not `MutationObserver` or polling.

By default, sync is **attribute → property** only; **property → attribute** is opt-in with
`reflect: true`.

For implementation details, see [`design.md`](./design.md). Shared registration mechanism:
[`../design.md`](../design.md).

```ts
import { tag, attribute, UIElement } from '../../../index.js';
import { t } from '../../template/index.js';

@tag('user-badge')
class UserBadge extends UIElement {
	@attribute({ type: Number, reflect: true }) readonly count = store(0);
	@attribute() readonly label = store('Guest');
}
```

Decorator-free equivalent (same registrations, no build step needed for decorators):

```ts
class UserBadge extends UIElement {
	readonly count = store(0);
	readonly label = store('Guest');
}
defineElement('user-badge', UserBadge, {
	attributes: { count: { type: Number, reflect: true }, label: {} }, // keys: any field of the class
});
```

`@attribute()` works on a **`store()` store** or on a **plain field**; it registers the attribute and never touches the
field itself. A store is updated with `.set(parsed)`, a plain field is assigned (`this.field = parsed`). When neither
`type` nor `converter` is given, the converter is inferred from the field's value (the store's value, or the plain value)
the first time it is needed.

**`reflect: true` needs a store.** Reflecting means observing writes to the property, which only a `store()` store
allows. On a plain field `reflect` has no effect: a dev-only `console.warn` (once per element and field, see
`dev/warn-attribute.ts`) says so, and attribute -> property still works.

```html
<user-badge count="3" label="Ada"></user-badge>
```

```js
el.count.get(); // 3 — parsed at upgrade
el.count.set(4); // re-renders; with reflect: true, updates count="4"
el.setAttribute('count', '9'); // attributeChangedCallback → store
```

## Requirements

- **A plain class field** (no `accessor`), holding either a `store()` store or a plain value. `reflect: true` additionally requires a store.
- **`@tag()` or `defineElement()`** — either sets `observedAttributes` before
  `customElements.define()`. `@tag()` reads `@attribute()` registrations from `context.metadata`;
  `defineElement()` registers its `attributes` map and reads it (and any decorator registrations) the same way - see [`../tag/README.md`](../tag/README.md).

Leave the field undecorated for fields that should never touch an attribute.

## `AttributeOptions`

| Option | Default | Effect |
|---|---|---|
| `name` | kebab-case of the field name | Attribute name to parse from / reflect to. This is what `@property()`'s `attribute` option was — there is no `false` case: leave a field undecorated for store-only fields. |
| `type` | inferred from the field's initial value | Selects the *default* converter (see below). Ignored if `converter` is given. |
| `reflect` | `false` | Whether JS writes (`.set()`) also update the host attribute. When `false`, sync is attribute → property only. |
| `converter` | — | Custom `{ fromAttribute, toAttribute }`, overriding `type`'s default. |

## `type` conversions

`type` takes the constructor (`String`, `Number`, `Boolean`, `Object`, `Array`)
a hint for the default converter, not a runtime `typeof` check. If omitted (and no `converter`),
the converter is **inferred from the field's initial value** at first-instance construction
(`inferAttributeType()` in [`converter.ts`](./converter.ts)) — so `@attribute() count = store(0)` matches
`@attribute({ type: Number }) count = store(0)`:

| Initial value | Inferred `type` |
|---|---|
| `number` (e.g. `0`) | `Number` |
| `boolean` (e.g. `false`) | `Boolean` |
| array (e.g. `[]`) | `Array` |
| plain object (e.g. `{}`) | `Object` |
| anything else (`string`, `null`, `undefined`, class instance, …) | `String` |

| `type` | Attribute present | Attribute absent | Property → attribute |
|---|---|---|---|
| `String` | raw string | `''` | `setAttribute(name, String(value))`; `value == null` removes it |
| `Number` | `Number(value)` | `0` | `setAttribute(name, String(value))` |
| `Boolean` | `true` (any text, including `""`) | `false` | present (empty string) if truthy, removed if falsy — same as `?attr` in [`../../template/tag-funcs/html/html.md`](../../template/tag-funcs/html/html.md) |
| `Object` / `Array` | `JSON.parse`, fallback `{}` / `[]` if unparsable | `{}` / `[]` | `JSON.stringify`; falsy value → `''` (present, not removed) |

Pass `type` explicitly when inference is wrong — e.g. `null` initializer infers `String`; use
`type: Object` or a custom `converter` for a complex-object field.

## Custom `converter`

For anything the five defaults do not cover — non-empty JSON fallback, `Date`, validated enum, etc.:

```ts
@attribute({
	type: Object,
	reflect: true,
	converter: {
		fromAttribute: (value: string | null) => {
			try { return value ? JSON.parse(value) : { theme: 'dark' }; } catch { return { theme: 'dark' }; }
		},
		toAttribute: (value: unknown) => (value ? JSON.stringify(value) : ''),
	},
})
readonly config = store({ theme: 'dark' });
```

`type` alongside `converter` is a readability hint only (no runtime effect once `converter` is set).

`fromAttribute` may return `undefined` to mean "leave the store unchanged" (`attributeChangedCallback`
skips `.set`). `toAttribute` may return `undefined` to mean "leave the host attribute unchanged"
(reflection skips `setAttribute` / `removeAttribute`).

## Complex-object fields

Same [`SignalTree`](../../../reactive/store/README.md) backing as any `store()` field — use `type: Object` when the
attribute should mirror JSON:

```ts
@attribute({ type: Object, reflect: true }) readonly config = store({ theme: 'dark' });
```

```html
<config-panel config='{"theme":"light"}'></config-panel>
```

Leaf-level reactivity and whole-object `.set()` semantics: [`../store/README.md`](../store/README.md).

## How the two sync directions work

- **Attribute → property** — `tag()` sets `ctor.observedAttributes` from every registered
  `@attribute()` field (own + inherited). The browser calls `UIElement`'s private
  `attributeChangedCallback` when an observed attribute is set, changed, or removed — including once
  per attribute already in static markup at **upgrade**, before `connectedCallback`. The callback
  parses with the field's `converter` and calls `.set()` on the backing store.
- **Property → attribute** — only for `@attribute({ reflect: true })`. In `connectedCallback`,
  [`wire-reflect.ts`](./wire-reflect.ts) registers one `effect()` per reflecting field that reads the
  store and calls `setAttribute` / `removeAttribute`; runs once immediately on connect, then on
  changes; disposed on disconnect like the render effect.
- **No infinite loop** — the store notifies only on real value changes (`Object.is`), so reflecting
  the same serialized text back does not re-trigger endlessly.
- **Template `.prop` bindings** from a parent pass plain values (a bare signal `.prop=${sig}` is followed and its
  value passed; `raw(sig)` stops the following and writes the signal as a plain value, so a store field gets it through `.set(sig)`); `PropertyPart` forwards into
  `.set()` on the child's store — same as for any store field (see [`../store/README.md`](../store/README.md)).

## Related reading

- [`./design.md`](./design.md) - converter, registration, `observedAttributes`, reflection, inheritance, loops.
- [`../store/README.md`](../store/README.md) — store-only fields and complex-object behavior.
- [`../tag/README.md`](../tag/README.md) - `@tag()` / `defineElement()`.
- [`../README.md`](../README.md) / [`../design.md`](../design.md) — shared overview.
- [`../../ui-element.ts`](../../ui-element.ts) — `tag()`, `attributeChangedCallback`.
- [`../../template/tag-funcs/html/html.md`](../../template/tag-funcs/html/html.md) — `?attr` / `.prop` conventions.
- [`attribute.test.ts`](./attribute.test.ts) — upgrade seeding, reflect, booleans, stacking.
