# Built-in directives

Index of built-in template directives. Each folder has its own README (and usually `design.md`).

| Directive | Docs |
|---|---|
| `classMap` | [`class-map/README.md`](./class-map/README.md) · [design](./class-map/design.md) |
| `styleMap` | [`style-map/README.md`](./style-map/README.md) · [design](./style-map/design.md) |
| `html` | [`html/`](./html/) |
| `mapByKey` | [`map-by-key/README.md`](./map-by-key/README.md) · [design](./map-by-key/design.md) |
| `bind` | [`bind/README.md`](./bind/README.md) · [design](./bind/design.md) |
| `virtualize` | [`virtualize/README.md`](./virtualize/README.md) · [design](./virtualize/design.md) |

Shared protocol: [`../directive.ts`](../directive.ts). How to write a custom directive:
[`../html.md`](../html.md#directives).

**No `if` / `for` / `switch` directives** — use JS (`? :`, `map`, `switch`) and
[`mapByKey`](./map-by-key/README.md) where keys matter:
[`why-not-structure-directives.md`](./why-not-structure-directives.md).

**No async pipe or async directive** — bridge Promises and observable-like sources with
[`toSignal`](../../signal/to-signal/README.md) / [`toSignalFrom`](../../signal/to-signal/README.md#reactive-sources-tosignalfromfactory-options), then bind signals in templates:
[`why-not-async-directives-or-pipes.md`](./why-not-async-directives-or-pipes.md).
