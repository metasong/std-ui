# std-ui

Minimal UI on web standards: reactive **signals**, **tagged HTML templates**, and **Custom Elements**—no virtual DOM and no framework runtime.

Guides for the library under `src/` (`signal/`, `template/`, `ui-element.ts`):

| Topic | File |
|---|---|
| Signals (`signal`, `computed`, `effect`) | [`src/reactive/signal/signal.md`](./src/reactive/signal/signal.md) |
| Reactive state tree | [`src/reactive/state/README.md`](./src/reactive/state/README.md) |
| Async → signal (`toSignal`) | [`src/reactive/to-signal/README.md`](./src/reactive/to-signal/README.md) · [design](./src/reactive/to-signal/design.md) |
| HTML templates (`t`, `render`) | [`src/template/html.md`](./src/template/html.md) |
| CSS templates (`css`, `static styles`) | [`src/template/css.md`](./src/template/css.md) |
| `classMap` | [`src/template/directives/class-map/README.md`](./src/template/directives/class-map/README.md) · [design](./src/template/directives/class-map/design.md) |
| `styleMap` | [`src/template/directives/style-map/README.md`](./src/template/directives/style-map/README.md) · [design](./src/template/directives/style-map/design.md) |
| Component fields (`state`, `@attribute`, `defineElement`) | [`src/decorators/README.md`](./src/decorators/README.md) · [design](./src/decorators/design.md) |
| Context (add-on, moved) | see the [std-ui-ext](../std-ui-ext/README.md) package |
| **Signals driving template render** (end-to-end) | [`src/doc/signal-drives-html.md`](./src/doc/signal-drives-html.md) |
| **Saved re-rendering** (`strings` identity, `UIElement` updates) | [`src/doc/saved-ui-rerendering.md`](./src/doc/saved-ui-rerendering.md) |

The [`src/doc/signal-drives-html.example.test.ts`](./src/doc/signal-drives-html.example.test.ts) file is the runnable counterpart to the guide: it exercises the same patterns under Vitest so the examples stay honest as the library evolves.

**Browser demo:** [`demo/README.md`](./demo/README.md) — `npm run demo` from this package (Vite, port 5174).

**Build:** [`doc/build.md`](./doc/build.md) — npm package build and minified browser bundles (`npm run build:bundle`).
