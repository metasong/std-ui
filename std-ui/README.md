# std-ui

Minimal UI on web standards: reactive **signals**, **tagged HTML templates**, and **Custom Elements**—no virtual DOM and no framework runtime.

Guides for the library under `src/` (`signal/`, `template/`, `ui-element.ts`):

| Topic | File |
|---|---|
| Signals (`signal`, `computed`, `effect`) | [`src/signal/core/signal.md`](./src/signal/core/signal.md) |
| Reactive state tree | [`src/signal/tree.md`](./src/signal/tree.md) |
| HTML templates (`html`, `render`) | [`src/template/html.md`](./src/template/html.md) |
| Attribute directives (`classMap`, `styleMap`) | [`src/template/directives/README.md`](./src/template/directives/README.md) · [design](./src/template/directives/design.md) |
| Component fields (`@state`, `@attribute`) | [`src/decorators/README.md`](./src/decorators/README.md) · [design](./src/decorators/design.md) |
| Context (`@state({ contextKey })`, `@consume`) | [`src/decorators/context/README.md`](./src/decorators/context/README.md) · [design](./src/decorators/context/design.md) |
| **Signals driving template render** (end-to-end) | [`src/doc/signal-drives-html.md`](./src/doc/signal-drives-html.md) |

The [`src/doc/signal-drives-html.example.test.ts`](./src/doc/signal-drives-html.example.test.ts) file is the runnable counterpart to the guide: it exercises the same patterns under Vitest so the examples stay honest as the library evolves.
