# mini-ui documentation

Guides for the reactive UI stack in this folder (`signal/`, `template/`, `component.ts`).

| Topic | File |
|---|---|
| Signals (`signal`, `computed`, `effect`) | [`../signal/signal.md`](../signal/signal.md) |
| Reactive state tree | [`../signal/tree.md`](../signal/tree.md) |
| HTML templates (`html`, `render`) | [`../template/html.md`](../template/html.md) |
| **Signals driving template render** (end-to-end) | [`signal-drives-html.md`](signal-drives-html.md) |

The [`signal-drives-html.example.test.ts`](signal-drives-html.example.test.ts) file is the runnable counterpart to the guide: it exercises the same patterns under Vitest so the examples stay honest as the library evolves.
