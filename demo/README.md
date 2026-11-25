# std-ui demos

One routed app (`app/`) with one folder per page under [`pages/`](./pages/): `tour`, `bind`, `slot`, `virtualize`, `router` (one feature per page, nothing mixed) and `integration` (several features working together, e.g. the people directory: `bind()` + validation + `virtualize()`). Each page folder has `index.ts` (imports its sections), `page.ts` (the `<code-preview>` layout) and `sections/`.

Shared styles (`std-theme.css`, `demo-components.css`) live in [`styles/`](./styles/); `index.html` is the single entry: `app/` (`main.ts`, `pages.ts`) routes `/tour`, `/bind`, `/virtualize`, `/slot`, `/router` and `/integration` with `<std-router>`, loading each page on demand.

A small Vite app that mounts one custom element per feature area (`demo-*-section` tags in
[`feature-page.ts`](./pages/tour/page.ts)). Each section’s source lives under [`pages/tour/sections/`](./pages/tour/sections/).

## Browser bundle only (no Vite on std-ui)

Prebuilt `dist/browser/` bundles loaded directly live in [`browser-bundle/`](./browser-bundle/) (static pages, served by `npm run demo`).

See [`browser-bundle/README.md`](./browser-bundle/README.md).

## How to run

From the **`src/std-ui`** package directory (where [`package.json`](../package.json) lives):

```bash
npm run demo
```

That starts Vite with [`vite.config.ts`](./vite.config.ts) (default port **5174**; the browser should open automatically). No separate `npm install` is required in `demo/` if dependencies are already installed for the fireworks repo / `@std-ui/core` package.

From **`demo/`** directly:

```bash
npx vite
```

Production-style static output (optional):

```bash
npx vite build
npx vite preview
```

## `bind()` demo (dedicated page)

Two-way property binding — native form fields and a custom element with `level-change`:

```bash
npm run demo
```

Open [http://localhost:5174/bind](http://localhost:5174/bind). Sources: [`pages/bind/page.ts`](./pages/bind/page.ts), [`pages/bind/sections/`](./pages/bind/sections/).

API notes: [`../core/src/element/template/directives/bind/README.md`](../core/src/element/template/directives/bind/README.md).

## `virtualize` demo (dedicated page)

Large-list examples live on a separate page so the main tour stays short:

```bash
npm run demo
```

Then open [http://localhost:5174/virtualize](http://localhost:5174/virtualize). Sources: [`pages/virtualize/page.ts`](./pages/virtualize/page.ts), [`pages/virtualize/sections/`](./pages/virtualize/sections/).

| Block | Module | What it shows |
|-------|--------|----------------|
| Vertical | [`pages/virtualize/sections/vertical-section.ts`](./pages/virtualize/sections/vertical-section.ts) | 10k fixed-height rows, `VirtualizeController` / `scrollToIndex` |
| Headers | [`pages/virtualize/sections/headers-section.ts`](./pages/virtualize/sections/headers-section.ts) | Variable heights, `isHeader` sticky sections |
| Grid | [`pages/virtualize/sections/grid-section.ts`](./pages/virtualize/sections/grid-section.ts) | `lanes: 4` grid |
| Horizontal | [`pages/virtualize/sections/horizontal-section.ts`](./pages/virtualize/sections/horizontal-section.ts) | `direction: 'horizontal'` |

API notes: [`../ext/src/element/template/directives/virtualize/README.md`](../ext/src/element/template/directives/virtualize/README.md).

## Sections

| Tag | Module | What it shows |
|-----|--------|----------------|
| `demo-counter-section` | [`pages/tour/sections/counter-section.ts`](./pages/tour/sections/counter-section.ts) | Signals, `UIElement`, `template()` |
| `demo-attribute-section` | [`pages/tour/sections/attribute-section.ts`](./pages/tour/sections/attribute-section.ts) | `@attribute()` |
| `demo-context-section` | [`pages/tour/sections/context-section.ts`](./pages/tour/sections/context-section.ts) | `@consume()` / `@provide()` |
| `demo-query-section` | [`pages/tour/sections/query-section.ts`](./pages/tour/sections/query-section.ts) | `@query()` |
| `demo-shadow-section` | [`pages/tour/sections/shadow-section.ts`](./pages/tour/sections/shadow-section.ts) | Shadow DOM + `static styles` |
| `demo-css-section` | [`pages/tour/sections/css-section.ts`](./pages/tour/sections/css-section.ts) | `css` tagged styles in light DOM |
| `demo-directives-section` | [`pages/tour/sections/directives-section.ts`](./pages/tour/sections/directives-section.ts) | `classMap`, `styleMap`, `html` |
| `demo-bindings-section` | [`pages/tour/sections/bindings-section.ts`](./pages/tour/sections/bindings-section.ts) | Event modifiers (`.once`/`.prevent`/`.stop`/`.self`), `class.name`, `style.prop` |
| `demo-todo-section` | [`pages/tour/sections/todo-section.ts`](./pages/tour/sections/todo-section.ts) | Composition; positional list via `.map()` |
| `demo-map-by-key-section` | [`pages/tour/sections/map-by-key-section.ts`](./pages/tour/sections/map-by-key-section.ts) | Keyed lists via `mapByKey` (sort + checkboxes) |

## `mapByKey` — sortable chore list

The **Keyed lists** section is the browser counterpart to the Lit-style `repeat()` tutorial: sort
with **A → Z** / **Z → A**, tick a checkbox on one row, then sort again. The box should stay on the
same chore because `mapByKey` reconciles by `id`. Compare with **todo list** above, which uses
`this.todos.get().map(...)` and is fine for append/remove but would mis-attach control state if you reordered.

- Live UI: run the demo and scroll to **Keyed lists (`mapByKey`)**.
- Automated check: from `src/std-ui`, `npm test -- map-by-key-sort.example` (see [`../core/src/doc/map-by-key-sort.example.test.ts`](../core/src/doc/map-by-key-sort.example.test.ts)).
- API notes: [`../core/src/element/template/directives/map-by-key/README.md`](../core/src/element/template/directives/map-by-key/README.md).
