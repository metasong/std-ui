# std-ui

Minimal UI on web standards: reactive **signals**, **tagged HTML templates**, and **Custom Elements**—no virtual DOM and no framework runtime.

Guides for the stack in this folder (`signal/`, `template/`, `component.ts`):

| Topic | File |
|---|---|
| Signals (`signal`, `computed`, `effect`) | [`../signal/core/signal.md`](../signal/core/signal.md) |
| Reactive state tree | [`../signal/tree.md`](../signal/tree.md) |
| HTML templates (`html`, `render`) | [`../template/html.md`](../template/html.md) |
| Component properties (`@property`, attributes) | [`property/README.md`](./property/README.md) · [design](./property/design.md) |
| **Signals driving template render** (end-to-end) | [`signal-drives-html.md`](signal-drives-html.md) |

The [`signal-drives-html.example.test.ts`](signal-drives-html.example.test.ts) file is the runnable counterpart to the guide: it exercises the same patterns under Vitest so the examples stay honest as the library evolves.
