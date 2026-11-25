# Reactive store fields (formerly `@stateTree()`)

There is no `@stateTree()` decorator anymore. A reactive field of a `UIElement` is simply a
`stateTree(...)` (see [`../../../reactive/state-tree/README.md`](../../../reactive/state-tree/README.md)):

```ts
class CounterChip extends UIElement {
	readonly count = stateTree(0);
	readonly config = stateTree({ theme: 'dark', limits: { max: 10 } });

	protected override template() {
		return t`<span>${this.count.get()} ${this.config.theme.get()}</span>`;
	}
}

el.count.get();              // 0
el.count.set(3);         // updates the store and schedules a re-render
```

**Why it was removed:** a decorator can't change the declared type of the field it decorates, so
`@stateTree() count = 0` was still typed `number` — `this.count.get()` / `.set()` showed up as errors in
IntelliSense. With the store as the field, the type is `StateTree<number>` from the start, and the
class-wiring machinery that swapped the field for an accessor (`field-store.ts`) is gone.

- **Per-instance** — each instance runs the field initializer, so each gets its own store.
- **Plain objects/arrays** become a tree of signals (per-leaf reactivity); primitives are a single
  leaf. `this.config.set({ ...this.config.peek(), theme: 'light' })` only notifies readers of the
  `theme` leaf.
- **No attribute** — a plain store never touches an attribute. To mirror one, use
  `@attribute()` or `defineElement(..., { attributes })` ([`../attribute/README.md`](../attribute/README.md)).
- **Parent `.prop` bindings** pass plain values; `PropertyPart` forwards them into `.set()` on the
  child's store.
- **Context** — expose a store to descendants with `@provide(key)` / `defineElement({ provide })`
  ([`../context/README.md`](../context/README.md)).

Tests: [`state.test.ts`](./state.test.ts). Why there is no decorator, and what replaced each old
responsibility: [`design.md`](./design.md).
