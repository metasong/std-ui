# std-ui

Minimal UI on web standards: reactive **signals**, **tagged HTML templates**, and **Custom Elements**—no virtual DOM and no framework runtime.

Guides for the library under `src/` (`signal/`, `template/`, `ui-element.ts`):

| Topic | File |
|---|---|
| Signals (`signal`, `computed`, `effect`) | [`src/reactive/signal/state.md`](./src/reactive/signal/state.md) |
| Reactive store | [`src/reactive/store/README.md`](./src/reactive/store/README.md) |
| Async → signal (`toSignal`) | [`src/reactive/to-signal/README.md`](../ext/src/reactive/to-signal/README.md) · [design](../ext/src/reactive/to-signal/design.md) |
| HTML templates (`t`, `render`) | [`src/element/template/tag-funcs/html/html.md`](./src/element/template/tag-funcs/html/html.md) |
| CSS templates (`css`, `static styles`) | [`src/element/template/tag-funcs/css/css.md`](./src/element/template/tag-funcs/css/css.md) |
| `classMap` | [`src/template/directives/class-map/README.md`](./src/template/directives/class-map/README.md) · [design](./src/template/directives/class-map/design.md) |
| `styleMap` | [`src/template/directives/style-map/README.md`](./src/template/directives/style-map/README.md) · [design](./src/template/directives/style-map/design.md) |
| Component fields (`state`, `@attribute`, `defineElement`) | [`src/decorators/README.md`](./src/decorators/README.md) · [design](./src/decorators/design.md) |
| Context (add-on, moved) | see the [std-ui-ext](../ext/README.md) package |
| **Signals driving template render** (end-to-end) | [`doc/signal-drives-html.md`](./doc/signal-drives-html.md) |
| **Saved re-rendering** (`strings` identity, `UIElement` updates) | [`doc/saved-ui-rerendering.md`](./doc/saved-ui-rerendering.md) |

The [`doc/signal-drives-html.example.test.ts`](./doc/signal-drives-html.example.test.ts) file is the runnable counterpart to the guide: it exercises the same patterns under Vitest so the examples stay honest as the library evolves.

**Browser demo:** [`demo/README.md`](./demo/README.md) — `npm run demo` from this package (Vite, port 5174).

**Build:** [`doc/build.md`](./doc/build.md) — npm package build and minified browser bundles (`npm run build:bundle`).
