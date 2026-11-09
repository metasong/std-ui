# `@state({ contextKey })` / `@consume()` — passing state down through descendants

Lets a `UIElement` (see `../../ui-element.ts`) expose part of its own `@state()` to **any**
descendant - not just direct children - without threading it down as attributes/properties
through every intermediate element, and without those intermediate elements needing to know the
value even exists. Two halves:

- **`@state({ contextKey })`** — the *provide* side. An ordinary `@state()` field
  (`../state/state.decorator.ts`), with one extra option: also expose this field's value to descendants.
- **`@consume(contextKey)`** — the *consume* side. A field decorator that reads the value from
  the nearest ancestor providing that `contextKey`, reactively - same `template()`/`effect()`
  tracking as reading a local `@state()` field.

```ts
import { tag, state, consume, createContextKey, UIElement } from '../../index.js';

interface Theme {
	mode: 'light' | 'dark';
}

// A ContextKey<T> is the identity both sides link through - see "ContextKey" below.
export const ThemeKey = createContextKey<Theme>('theme');

@tag('app-root')
class AppRoot extends UIElement {
	@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };

	protected override connect() {
		this.theme.set({ mode: 'light' }); // any descendant @consume(ThemeKey) field re-renders
	}
}

@tag('deeply-nested-button') // doesn't matter how many elements sit between this and <app-root>
class ThemedButton extends UIElement {
	@consume(ThemeKey) theme!: Theme; // `Theme` inferred from `ThemeKey` - no generic needed here

	protected override template() {
		return t`<button class=${this.theme.mode}>Click</button>`;
	}
}
```

For implementation details, see [`design.md`](./design.md).

## `ContextKey<T>`

```ts
export const ThemeKey = createContextKey<Theme>('theme');
```

A `ContextKey<T>` - not a plain `string`/`symbol` - is what links a provider to its consumers:

- **Not a `string`**: two unrelated features that happened to both pick `'theme'` would silently
  collide. A `ContextKey` is matched by **identity**, not by name, so this can't happen.
- **Not a plain `symbol`**: a `Symbol('theme')` would fix the collision problem, but `@consume()`
  would have no way to know what type comes back - every call site would need an explicit (and
  unchecked) `@consume<Theme>(key)`.
- **`createContextKey<T>(description)`** instead carries `T` as part of the key's own type, so
  TypeScript infers (and checks) `V` automatically on both sides, from the key alone:
  `@state<T, V>({ contextKey: ContextKey<V> })` and `@consume<T, V>(ContextKey<V>)`. `description`
  is for debugging/error messages only (e.g. the "no provider found" error below) - it is **never**
  used for matching.

One key per logical piece of context, created once (e.g. exported from a module), shared by every
provider/consumer pair that should be linked - the same way you'd define one HTML attribute name
per concern, except collision-proof.

## `@state({ contextKey })` (provide)

Exactly `@state()` (see [`../state/README.md`](../state/README.md)) - same reactive store, same plain-field-only
mechanics, same complex-object (`SignalTree`) handling - plus registers the field so
descendants can find it:

```ts
@state({ contextKey: ThemeKey }) theme: Theme = { mode: 'dark' };
```

Writing `this.theme.set(...)` re-renders this element's own `template()` *and* notifies every
descendant `@consume(ThemeKey)` field, exactly the way it would notify this element's own `effect()`s.

**Re-providing (overriding for a sub-tree):** a descendant element can itself declare
`@state({ contextKey: ThemeKey })` with a different value - every `@consume(ThemeKey)` field
*below that descendant* resolves to its value instead of the root's, the same way a nested
`<div style="color: red">` wins over an ancestor's - see
["Nearest provider wins"](./design.md#nearest-provider-wins) in the design doc.

## `@consume(contextKey)` (consume)

```ts
@consume(ThemeKey) theme!: Theme;
```

- **Plain field only** - no `accessor` support. A consumed field is never written locally (see
  below), so there's no local initializer/storage slot for it to own; give it a type annotation
  (`!: Theme`), not an initializer.
- **Reactive** - reading `this.theme` inside `template()`/`effect()` tracks the provider's value
  (consumers still see a plain value, not a store).
- **Read-only** - `this.theme = ...` throws. The provider owns the value; to change it, call
  `.set()` on the provider's `@state({ contextKey })` field.
- **Resolved once per connect**, against whichever provider is the nearest ancestor *at the moment
  this element connects* - see [`design.md`](./design.md) for exactly when/how.
- **Throws if nothing provides `contextKey`** when this element connects - there is no default
  value/fallback. Provide one explicitly, with a matching `@state({ contextKey })`, somewhere
  above this element in the tree:

  ```
  Error: @consume() field "theme" on <deeply-nested-button> found no ancestor providing
  context "theme" - add a matching @state({ contextKey }) further up the tree.
  ```

## When to use this vs. just passing a property

Reach for context only when a value needs to reach an *unknown or arbitrarily deep* set of
descendants - a theme, a form's shared validation state, a router's current route - where plumbing
it through every intermediate element's own properties would be pure boilerplate for elements that
don't otherwise care about the value. For anything a direct child needs, prefer an ordinary
property/attribute (`@attribute()`/`@state()` on the child, set by the parent in its own
`template()`) - it's simpler to trace and doesn't depend on DOM structure at all.

## Related reading

- [`./design.md`](./design.md) — how resolution, reactivity, and "nearest provider wins" work internally.
- [`../state/README.md`](../state/README.md) / [`../design.md`](../design.md) — `@state()` / shared field wiring this builds on.
- [`../../ui-element.ts`](../../ui-element.ts) — `UIElement` lifecycle this plugs into.
- [`./consume.test.ts`](./consume.test.ts) — behavior tests.
