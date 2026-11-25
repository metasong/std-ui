# Why no `willUpdate` / `updated` / `shouldUpdate`?

Frameworks often run every update through a fixed pipeline and passes a `changedProperties` map to hooks:
`shouldUpdate -> willUpdate -> render -> updated`. That pipeline exists because they cannot see which`nvalues `render()` reads.

`UIElement` does not copy it. `template()` runs inside a signal effect, so the reactive graph already
knows what each piece of UI depends on. See also [`why-no-request-update.md`](./why-no-request-update.md).

## Lifecycle mapping

| Typical lifecycle | std-ui | Notes |
|---|---|---|
| `connectedCallback` | `connect()` | Runs on first connect only (`#connected` guard). |
| `disconnectedCallback` | `disconnect()` | Runs on every disconnect. |
| `render()` | `template()` | |
| `firstUpdated()` | `firstUpdated()` | After the first `template()` is applied. |
| `updated(changed)` | `updated()` or `this.effect()` | `updated()` has no `changedProperties`. |
| `willUpdate(changed)` | `computed()` | |
| `shouldUpdate(changed)` | none | See below. |
| `requestUpdate()` | write a signal | Not public. |
| `updateComplete` | `updateComplete` | Same idea. |

## `willUpdate`: derive with `computed()`

**Why not:** a hook would run on every render, even when its inputs did not change, and would have
to diff old and new values by hand.

**Our way:** `computed()` is lazy and tracked. It recomputes only when its dependencies change, and
`template()` reads it like any signal.

```ts
@tag('demo-total')
class DemoTotal extends UIElement {
	@stateTree() price = 10;
	@stateTree() qty = 2;
	readonly #total = computed(() => this.price.get() * this.qty.get());

	protected override template() {
		return t`<p>Total: ${this.#total.get()}</p>`;
	}
}
```

## `updated(changed)`: react with `effect()`

**Why not:** a `changedProperties` map needs the old value of every signal on every write. That adds
cost and works against fine-grained tracking.

**Our way:** `this.effect()` reads exactly the signals you care about, runs only when they change,
and is disposed on disconnect.

```ts
@tag('demo-search')
class DemoSearch extends UIElement {
	@stateTree() query = '';

	protected override connect() {
		this.effect(() => {
			const q = this.query(); // only `query` is tracked
			console.log('query changed', q);
		});
	}
}
```

Caveats:

- An effect is not guaranteed to run after the DOM is flushed. When you need the updated DOM, use
  `updated()` (every render), or `await this.updateComplete` inside the effect.
- `updated()` fires on every render and cannot tell what changed. Use an effect for per-signal work.

## `shouldUpdate`: read fewer signals

**Why not:** a render happens because a tracked signal changed. A hook that vetoes renders would
fight the effect system.

**Our way:** do not read the signals you do not want to track, or return early from `template()`
with a cached template. If one piece of UI should update on its own, bind a signal there, or use
`this.effect()` for that slice instead of re-rendering the whole component.

## If this is not enough

When a case needs per-signal work strictly after the DOM update, add one small primitive (for
example `this.afterRender(fn)`) instead of adding three hooks.
