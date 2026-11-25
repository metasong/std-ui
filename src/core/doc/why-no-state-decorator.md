# Why no `@state()` decorator?

Earlier versions had `@state()` (and `@attribute()`) decorators. `@state()` was removed. A reactive
field of a `UIElement` is now a plain `state(...)` class field:

```ts
@tag('demo-counter')
class DemoCounter extends UIElement {
	readonly count = state(0);
	readonly config = state({ theme: 'dark', limits: { max: 10 } });

	protected override template() {
		return t`<button @click=${() => this.count.update(n => n + 1)}>${this.count()} ${this.config.theme()}</button>`;
	}
}

el.count();      // 0
el.count.set(3); // updates the store and schedules a re-render
```

## History

### 1. Signal hidden behind a plain field

`@state() count = 3` was backed by a signal through a getter/setter. You used it as a plain field
(`this.count`, `this.count = 4`).

Problem: the signal was hidden, so nothing could be composed onto it. You cannot attach
validation / error checking, derived values, or change handling (`computed`, `effect`, `bind`,
flags) to something that only looks like a number.

### 2. Expose the field as the signal (`549c92e`)

The decorator turned the field into its backing store: read with `this.count()`, write with
`this.count.set(4)` / `.update()`. Now the signal can be composed with (validation, error state,
derived values, bindings).

Problem: typing. A field decorator can only return an initializer, call `context.addInitializer`,
or register metadata. It **cannot change the declared type** of the field. `@state() a = 1` is
typed `number`, but at runtime it is a store, so `this.a()` and `.set()` were IntelliSense errors.

### 3. Remove the decorator (`c9cb97e`)

> remove @state and directly use signalState, because type problem when @state a = 1 // int. not a signal.

Making the field the store itself fixes the type at the source: `SignalState<number>`.
`signalState(...)` (later renamed `state()`) returns a correctly typed signal, so the decorator
added nothing but the type mismatch.

It also removed the machinery that existed to swap a field for an accessor (`field-store.ts`:
`applyFieldStore()` / `createStore()`, the `addInitializer` + `Object.defineProperty` wiring, and the
`onInitialValue` hook `@attribute()` used for converter inference).

## What replaced each old responsibility

| Old responsibility | Now |
|---|---|
| Create the store from the initial value | The field initializer: `state(initial)` |
| Per-instance store | Each instance runs the initializer, so each gets its own store |
| Plain objects / arrays become a signal tree | `state()` itself (per-leaf reactivity; primitives are a single leaf) |
| `contextKey` on `@state()` | `@provide(key)` / `defineElement({ provide })` |
| Attribute inference from the initial value | `resolveInferredConverter()` reads `this[key].peek()` on first use |
| Composing validation / derived / change handling | The field is a signal: `computed`, `effect`, `bind` work on it directly |

## Rules this implies

- Create the store **per instance**: declare `state(...)` in the class body, not at module level,
  unless sharing is intended.
- Write through `.set()` / `.update()`. Template `.prop` bindings from a parent pass plain values;
  `PropertyPart` forwards them into `.set()` on the child's store.
- A plain `state()` never touches an attribute. To mirror one, use `@attribute()` or
  `defineElement(..., { attributes })`.
- Registration decorators (`@attribute`, `@provide`) are typed to store fields only, so applying
  them to a plain value is a compile error.

The old per-decorator docs were deleted in `80c0258`; recover them with
`git show 80c0258^:src/core/src/element/decorators/state/README.md` (and `design.md`).

See also: [`why-no-request-update.md`](./why-no-request-update.md), [`why-no-update-hooks.md`](./why-no-update-hooks.md), [`../src/reactive/signal/state.md`](../src/reactive/signal/state.md).
