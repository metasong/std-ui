# Feats

Ready-made [`UIFeat`](../../../../core/src/element/feat/README.md)s.

## `HotkeyFeat` / `@hotkeys()`

Runs a handler for each `KeyboardEvent.key` while the host is connected. The listener is removed on disconnect.

```ts
class Dialog extends UIElement {
	readonly #keys = new HotkeyFeat(this, { Escape: () => this.close() });
}

// or, declaratively (list below @tag)
@tag('x-dialog')
@hotkeys({ Escape: (e) => (e.currentTarget as Dialog).close() })
class Dialog extends UIElement {}
```

| Parameter | Meaning |
|---|---|
| `host` | The element. |
| `keys` | `Record<KeyboardEvent['key'], (event) => void>`. |
| `target` | Where to listen. Default: the host (it or a focused descendant receives keys). Pass `window` for global keys. |
