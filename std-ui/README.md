# std-ui

Minimal UI on web standards: reactive **signals**, **tagged HTML templates**, and **Custom Elements**—no virtual DOM and no framework runtime.

Guides for the library under `src/` (`signal/`, `template/`, `ui-element.ts`):

| Topic | File |
|---|---|
| Signals (`signal`, `computed`, `effect`) | [`src/signal/core/signal.md`](./src/signal/core/signal.md) |
| Reactive state tree | [`src/signal/tree/README.md`](./src/signal/tree/README.md) |
| Async → signal (`toSignal`) | [`src/signal/to-signal/README.md`](./src/signal/to-signal/README.md) · [design](./src/signal/to-signal/design.md) |
| HTML templates (`t`, `render`) | [`src/template/html.md`](./src/template/html.md) |
| CSS templates (`css`, `static styles`) | [`src/template/css.md`](./src/template/css.md) |
| `classMap` | [`src/template/directives/class-map/README.md`](./src/template/directives/class-map/README.md) · [design](./src/template/directives/class-map/design.md) |
| `styleMap` | [`src/template/directives/style-map/README.md`](./src/template/directives/style-map/README.md) · [design](./src/template/directives/style-map/design.md) |
| Component fields (`@state`, `@attribute`) | [`src/decorators/README.md`](./src/decorators/README.md) · [design](./src/decorators/design.md) |
| Context (`@state({ contextKey })`, `@consume`) | [`src/decorators/context/README.md`](./src/decorators/context/README.md) · [design](./src/decorators/context/design.md) |
| **Signals driving template render** (end-to-end) | [`src/doc/signal-drives-html.md`](./src/doc/signal-drives-html.md) |
| **Saved re-rendering** (`strings` identity, `UIElement` updates) | [`src/doc/saved-ui-rerendering.md`](./src/doc/saved-ui-rerendering.md) |

The [`src/doc/signal-drives-html.example.test.ts`](./src/doc/signal-drives-html.example.test.ts) file is the runnable counterpart to the guide: it exercises the same patterns under Vitest so the examples stay honest as the library evolves.

**Browser demo:** [`demo/README.md`](./demo/README.md) — `npm run demo` from this package (Vite, port 5174).

**Build:** [`doc/build.md`](./doc/build.md) — npm package build and minified browser bundles (`npm run build:bundle`).
