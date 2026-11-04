# `@property()` — attribute-backed component properties

`@property()` is a field decorator for `UIElement` (see `../component.ts`) subclasses: a decorated
field is backed by a reactive store (a `SignalTree`, see [`../signal/tree.md`](../signal/tree.md))
and, by default, parses an HTML attribute of the same (kebab-case) name into the field (attribute
-> property), using the platform's own custom-element monitoring mechanism (`observedAttributes` /
`attributeChangedCallback`) - not a `MutationObserver` or polling. The opposite direction (property
-> attribute) is opt-in via `reflect: true`, matching `lit`.

A primitive/array/class-instance field behaves exactly as a plain `signal()`-backed one always did.
A **plain-object** field instead becomes a tree of signals/computeds mirroring its shape - see
["Complex-object properties"](#complex-object-properties) below.

For implementation details, see [`design.md`](./design.md).

```ts
import { element, property, UIElement } from '../index.js';

@element('user-badge')
class UserBadge extends UIElement<AppState> {
	@property({ type: Number, reflect: true }) count = 0; // mirrors the `count` attribute both ways
	@property() label = 'Guest'; // attribute -> property only (string, the default); JS writes don't reflect back
	@property({ attribute: false }) internal = 'x'; // store-backed only, no attribute

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

- The field can be plain (`@property() foo = 0;`) or an `accessor` field
  (`@property() accessor foo = 0;`) - both work.
- The class must also be decorated with `element()` (see `../component.ts`). `element()` reads the
  `@property()` registrations made while the class body was evaluating and uses them to set
  `observedAttributes` before calling `customElements.define()`.

## `PropertyOptions`

| Option | Default | Effect |
|---|---|---|
| `attribute` | kebab-case of the field name | Attribute name to parse from. Pass `false` to disable attribute syncing entirely - the field is then a plain store-backed property, settable/readable in JS only. |
| `type` | inferred from the field's initial value | Selects the *default* attribute <-> property converter (see below). Ignored if `converter` is given. |
| `reflect` | `false` | Whether writing the property (from JS) also reflects back onto the attribute. When `false` (default, like `lit`), sync is attribute -> property only. |
| `converter` | — | Fully custom `{ fromAttribute, toAttribute }` pair, overriding `type`'s default - see below. |

## `type` conversions

`type` takes the constructor itself (`String`, `Number`, `Boolean`, `Object`, `Array`), matching
`lit`'s convention - it's a hint selecting a default converter, not a runtime `typeof` check. If
omitted (and no `converter` is given either), it's **inferred from the field's own initial value**
(`inferPropertyType()` in `./converter.ts`) once that value is known, at first-instance
construction time - so `@property() count = 0;` behaves exactly like `@property({ type: Number })
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
@property({
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

## Complex-object properties

A `@property()` field whose value is a plain object (`{ ... }`) is backed by a full
[`SignalTree`](../signal/tree.md) instead of a single flat `signal()` - every leaf of the object gets
its own independently-writable `Signal`, and reads flow through a `Computed` that only recomputes
when a leaf actually touched by a write changes:

```ts
class ConfigPanel extends UIElement<AppState> {
	@property({ attribute: false }) config = { theme: 'dark', limits: { max: 10 } };

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

Pass `attribute: false` if a complex-object field shouldn't touch the DOM attribute at all, or
`type: Object` (the default JSON converter - see above) if you do want it reflected to/from the
attribute as JSON text:

```ts
@property({ type: Object, reflect: true }) config = { theme: 'dark' };
```

```html
<config-panel config='{"theme":"light"}'></config-panel>
```

## How the two directions work

- **Attribute -> property**: `element()` computes `ctor.observedAttributes` from every
  `@property()`-registered attribute (own + inherited). The browser calls `UIElement`'s private
  `attributeChangedCallback` natively whenever one of those attributes is set, changed, or removed -
  including once per attribute already present in static markup, right when the element upgrades,
  *before* `connectedCallback`. That callback parses the new text per `type`/`converter` and calls
  `.set()` on the field's backing store.
- **Property -> attribute** (only for `@property({ reflect: true })` fields): in
  `connectedCallback`, `UIElement` sets up one `effect()` per reflecting `@property()` that reads
  the field's store and calls `setAttribute`/`removeAttribute` with the serialized value - run once
  immediately (so the attribute reflects the current value right away) and again whenever the value
  changes. These effects are disposed on disconnect, like the render effect.
- **No infinite loop**: writing the same (re-serialized) text back via `setAttribute` inside the
  attribute -> property direction is harmless because the store only notifies when the value
  actually changes (`Object.is`) - so the property -> attribute effect simply doesn't re-run for a
  no-op write.
- **Reads inside `template(state)`**: a `@property()` field's getter reads its store, so using
  `this.someProp` inside `template()` (or any `this.effect()`) tracks it like any other signal -
  the component re-renders when the property/attribute changes, same as a `state` field would.

## Related reading

- [`./design.md`](./design.md) — how registration, stores, and the two sync directions work internally.
- [`../component.ts`](../component.ts) / [`../doc/signal-drives-html.md`](../doc/signal-drives-html.md) - `UIElement` lifecycle this plugs into.
- [`../signal/core/signal.md`](../signal/core/signal.md) - the `signal()`/`effect()` primitives backing this.
- [`../template/html.md`](../template/html.md) - the `?attr`/`.prop` binding conventions `type: Boolean` mirrors.
