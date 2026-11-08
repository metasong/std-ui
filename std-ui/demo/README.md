# std-ui feature demo

A small Vite app that mounts one custom element per feature area (`demo-*-section` tags in
[`index.html`](./index.html)). Each section’s source lives under [`sections/`](./sections/).

## How to run

From the **`src/std-ui`** package directory (where [`package.json`](../package.json) lives):

```bash
npm run demo
```

That starts Vite with [`vite.config.ts`](./vite.config.ts) (default port **5174**; the browser should open automatically). No separate `npm install` is required in `demo/` if dependencies are already installed for the fireworks repo / `std-ui` package.

From **`demo/`** directly:

```bash
npx vite
```

Production-style static output (optional):

```bash
npx vite build
npx vite preview
```

## Sections

| Tag | Module | What it shows |
|-----|--------|----------------|
| `demo-counter-section` | [`sections/counter-section.ts`](./sections/counter-section.ts) | Signals, `UIElement`, `template()` |
| `demo-attribute-section` | [`sections/attribute-section.ts`](./sections/attribute-section.ts) | `@attribute()` |
| `demo-context-section` | [`sections/context-section.ts`](./sections/context-section.ts) | `@consume()` / provide |
| `demo-query-section` | [`sections/query-section.ts`](./sections/query-section.ts) | `@query()` |
| `demo-shadow-section` | [`sections/shadow-section.ts`](./sections/shadow-section.ts) | Shadow DOM + `static styles` |
| `demo-css-section` | [`sections/css-section.ts`](./sections/css-section.ts) | `css` tagged styles in light DOM |
| `demo-directives-section` | [`sections/directives-section.ts`](./sections/directives-section.ts) | `classMap`, `styleMap`, `unsafeHTML` |
| `demo-todo-section` | [`sections/todo-section.ts`](./sections/todo-section.ts) | Composition; positional list via `.map()` |
| `demo-map-by-key-section` | [`sections/map-by-key-section.ts`](./sections/map-by-key-section.ts) | Keyed lists via `mapByKey` (sort + checkboxes) |

## `mapByKey` — sortable chore list

The **Keyed lists** section is the browser counterpart to the Lit-style `repeat()` tutorial: sort
with **A → Z** / **Z → A**, tick a checkbox on one row, then sort again. The box should stay on the
same chore because `mapByKey` reconciles by `id`. Compare with **todo list** above, which uses
`this.todos.map(...)` and is fine for append/remove but would mis-attach control state if you reordered.

- Live UI: run the demo and scroll to **Keyed lists (`mapByKey`)**.
- Automated check: from `src/std-ui`, `npm test -- map-by-key-sort.example` (see [`../src/doc/map-by-key-sort.example.test.ts`](../src/doc/map-by-key-sort.example.test.ts)).
- API notes: [`../src/template/directives/map-by-key/README.md`](../src/template/directives/map-by-key/README.md).
