# `@provide(key)` / `@consume(key)` — passing state down through descendants

Lets a `UIElement` (from `std-ui`) expose one of its stores to **any** descendant — not
just direct children — without threading it through attributes/properties of every intermediate
element. Two halves:

- **Provide** — `@provide(key)` on a `state(...)` field, or the decorator-free
  `defineContext(Class, { provide: { theme: key } })`.
- **Consume** — `@consume(key) readonly theme!: Theme`: a read-only, reactive property holding the
  nearest ancestor's value, read as `this.theme.mode`. The decorator-free form is
  `defineContext(Class, { consume: { theme: key } })` (declare the field `readonly theme!: Theme`).

Both halves are registered **per class** (decorator metadata, or `defineContext` for plain classes) -
nothing is registered per instance.

```ts
import { tag, state, t, UIElement } from 'std-ui';
import { provide, consume, createContextKey } from 'std-ui-ext';

interface Theme { mode: 'light' | 'dark'; }
export const ThemeKey = createContextKey<Theme>('theme'); // identity both sides link through

@tag('app-root')
class AppRoot extends UIElement {
	@provide(ThemeKey) readonly theme = state<Theme>({ mode: 'dark' });
	// decorator-free: defineContext(AppRoot, { provide: { theme: ThemeKey } });

	protected override connect() {
		this.theme.set({ mode: 'light' }); // every descendant consuming ThemeKey re-renders
	}
}

@tag('deeply-nested-button') // however many elements sit between this and <app-root>
class ThemedButton extends UIElement {
	@consume(ThemeKey) readonly theme!: Theme; // `Theme` is checked against the key
	// decorator-free: defineContext(ThemedButton, { consume: { theme: ThemeKey } });

	protected override template() {
		return t`<button class=${this.theme.mode}>Click</button>`;
	}
}
```

## Decorator-free: `defineContext(Class, { provide, consume })`

Same registries as the decorators, no decorator syntax needed. Declare the fields as plain class
fields, then register them in typed maps. Call `defineContext` **before** `defineElement`
(or `customElements.define`) so elements upgraded at define time already see the registrations.

```ts
import { UIElement, defineElement, state, t } from 'std-ui';
import { defineContext, createContextKey } from 'std-ui-ext';

interface Theme { mode: 'light' | 'dark'; }
const ThemeKey = createContextKey<Theme>('theme');

class AppRoot extends UIElement {
	readonly theme = state<Theme>({ mode: 'dark' }); // provided: must be a store of the key's type
}
defineContext(AppRoot, { provide: { theme: ThemeKey } });
defineElement('app-root', AppRoot);

class ThemedButton extends UIElement {
	readonly theme!: Theme; // consumed: declared with the key's value type, read as `this.theme.mode`
	protected override template() {
		return t`<button class=${this.theme.mode}>Click</button>`;
	}
}
defineContext(ThemedButton, { consume: { theme: ThemeKey } });
defineElement('themed-button', ThemedButton);

// A single class can do both, and the maps are type-checked against the class:
//   defineContext(Panel, { provide: { theme: ThemeKey }, consume: { user: UserKey } });
// @ts-expect-error - `label` is a string but the key carries a `Theme`
//   defineContext(ThemedButton, { consume: { label: ThemeKey } });
```

`defineContext` returns the class and can be mixed with the decorators on the same class.
## `ContextKey<T>`

`createContextKey<T>(description)` carries `T` in its type and is matched by **identity** (not by
name), so two unrelated features can't collide, and `T` is checked on both sides: `@provide(key)`
requires the field to be `SignalState<T>` and `@consume(key)` a field of type `T` (`defineContext`'s `provide` / `consume` maps check the same). `description` is for error messages only.

## Provide

- `@provide(key)` only registers `{ field name, key }` for the class; the field is untouched. It's
  typed to store fields only — a plain value, or a store of the wrong value type, is a compile error.
- Writing `this.theme.set(...)` re-renders this element *and* notifies every consumer.
- **Re-providing:** a descendant can provide the same key; consumers below it get its value
  (nearest provider wins).

## Consume

- `@consume(key)` (or `defineContext(Class, { consume })`) registers `{ field name, key }` for the class. When an instance
  **connects**, the nearest ancestor provider is resolved and the field is defined on the instance as a getter over
  a signal; it is `undefined` until then.
- **Reactive** — reading `this.theme` in `template()`/`effect()` tracks the provider's value.
- **Read-only** — the property has no setter (writing throws; the type is `readonly`); change the value on
  the provider's store.
- **Needs `useDefineForClassFields`** — like the `@query*()` decorators, a `!:` field with no initializer must
  not be erased by the toolchain. (`defineContext(Class, { consume })` with a declared `readonly theme!: Theme` has the same need.)
- **Throws if nothing provides the key** when the element connects:

  ```
  Error: consume() on <deeply-nested-button> found no ancestor providing context "theme" -
  add a matching @provide(key) / defineContext(Class, { provide }) further up the tree.
  ```

## When to use this vs. a property

Reach for context when a value must reach an *unknown or deep* set of descendants (theme, shared
validation state, current route). For anything a direct child needs, prefer an ordinary
property/attribute set by the parent's `template()`.

## Related reading

- [`./design.md`](./design.md) — resolution and "nearest provider wins" (written for the old decorator API; the protocol is unchanged).
- [`std-ui` state](../../../std-ui/src/decorators/state/README.md) — reactive store fields.
- [`./consume.test.ts`](./consume.test.ts) — behavior tests.
