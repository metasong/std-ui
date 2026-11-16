# Why no public `requestUpdate()`?

A `requestUpdate()` marks an element dirty and queues an update. It exists because it cannot`nsee plain field mutations (an in-place `array.push`, a non-reactive field, external state).

`UIElement` does not expose one. Rendering is driven by signals: `template()` runs inside an
effect, so any signal it reads re-renders the element (batched in one microtask).

> `UIElement#requestUpdate` (private, `ui-element.ts`) is **not** a public `requestUpdate()`. It is the
> function the render effect runs: it calls `template()` and renders the result.

## Use instead

| Typical lifecycle | std-ui |
|---|---|
| `this.count++; ` (reactive property) | `this.count.set(n)` / `this.count.update(fn)` |
| mutate array/object, then `requestUpdate()` | `state` / `this.field.deep()` tree writes, or `.set()` a new value |
| external mutable source, then `requestUpdate()` | bridge it with `toSignal` / `toSignalFrom`, or a small `signal` you write on change |
| `await this.updateComplete` | `await this.updateComplete` (same) |

Why not add it:

- Mutating a plain field then forcing a render bypasses the signal graph. `computed()`s and
  `effect()`s reading the same data would not update.
- It encourages the habit of untracked state instead of signals.

## If you really need to force a render

Keep a private version signal that `template()` reads, and bump it:

```ts
@tag('demo-forced')
class DemoForced extends UIElement {
	readonly #version = signal(0);
	forceRender() { this.#version.update(v => v + 1); }

	protected override template() {
		this.#version(); // track
		return t`<p>${legacy.read()}</p>`;
	}
}
```

Treat this as an escape hatch. Prefer bridging the source into a signal.

Not provided either: `changedProperties`, `willUpdate`, `shouldUpdate`, `updated(changed)`. Use
`computed()` for derived values and `effect()` for side effects on specific signals.

See also: [`why-no-update-hooks.md`](./why-no-update-hooks.md), [`../element/ui-element.ts`](../element/ui-element.ts), [`../reactive/to-signal/README.md`](../reactive/to-signal/README.md).
