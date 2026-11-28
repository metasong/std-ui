# `UIFeat` - reusable features for a `UIElement`

A feature is a small object attached to **one element instance**. It gets the element's lifecycle, owns its
own signals and cleanup, and can be reused across components or used to split a large component into aspects.
Internals: [`design.md`](./design.md). Ready-made features: [`@std-ui/ext` feats](../../../../ext/src/element/feats/README.md).

```ts
class Clock extends UIFeat {
	readonly now = store(Date.now());

	protected override connected() {
		const id = setInterval(() => this.now.set(Date.now()), 1000);
		return () => clearInterval(id); // runs on disconnect
	}
}

@tag('x-clock')
class XClock extends UIElement {
	readonly #clock = new Clock(this); // create in a field initializer
	protected override template() {
		return t`<time>${new Date(this.#clock.now()).toLocaleTimeString()}</time>`;
	}
}
```

The template reads `this.#clock.now()`, so the host re-renders when it ticks. There is no `requestUpdate()`.

## Writing a feature

Extend `UIFeat<Host>` and override any of these (all optional, all `protected`):

| Method | When | Return |
|---|---|---|
| `beforeConnect()` | every connect, before the host's `connect()` | optional cleanup |
| `connected()` | every connect, after the host's `connect()` | optional cleanup |
| `firstUpdated()` | once per connection, after the first `template()` | optional cleanup |
| `updated()` | after every `template()` (not after a slot patched by a bare signal: `template()` did not re-run) | - |
| `attributeChanged(name, old, new)` | an observed attribute changed | - |
| `disconnected()` | every disconnect, after the cleanups | - |

- **Cleanup first.** Add and remove in one place: return the undo function from the phase that did the setup. Use
  `disconnected()` only for teardown with no matching setup (flush, reset).
- **`this.effect(fn, after?)`** starts a tracked effect owned by the connection. Call it from `beforeConnect`,
  `connected` or `firstUpdated`; it is disposed on disconnect and throws anywhere else.
- **`this.host`** is the element. Type it with the generic to state what the feature needs:
  `class Focus extends UIFeat<HTMLElement & UIElement> {}`.
- **Reconnect.** Setup runs again on every connect with fresh cleanups, so never rely on state left from the
  previous connection.

## Attaching

**Per instance** (a field initializer; supports constructor options and holds its own state):

```ts
readonly #hotkeys = new HotkeyFeat(this, { Escape: () => this.close() });
```

Create it in a field initializer so it registers before the element connects. Created after connect, it
catches up on `beforeConnect` / `connected` (and `firstUpdated` if it already ran).

**Per class** (declarative, e.g. from a decorator):

```ts
function hotkeys(keys: HotkeyMap) {
	return (_: unknown, ctx: ClassDecoratorContext) =>
		UIFeat.attachTo(ctx.metadata, host => new HotkeyFeat(host, keys));
}

@tag('x-dialog')   // list the feature decorator below @tag
@hotkeys({ Escape: () => {} })
class Dialog extends UIElement {}
```

`attachTo` makes one feature per element instance, lazily on its first connect.

`feature.dispose()` detaches a feature for good.

## When to use what

| Need | Use |
|---|---|
| Behavior shared by several components, or a concern split out of a big one | `UIFeat` |
| A one-off effect inside one component | `this.effect()` in `connect()` |
| Cross-cutting behavior on a class with no per-instance options | `UIFeat.attachTo` + a decorator |
| Changing how the DOM is bound | a [directive](../template/directives/directive.ts), not a feature |
