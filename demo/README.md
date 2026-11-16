# std-ui demos

Two folders:

- [`feature-demo/`](./feature-demo/): one feature per demo, nothing mixed (tour, `bind`, `slot`, `virtualize` pages).
- [`integration-demo/`](./integration-demo/): several features working together (e.g. the people directory: `bind()` + validation + `virtualize()`).

Shared styles (`material-theme.css`, `demo-components.css`, `virtualize-list.css`) live in `demo/`; `index.html` links to both demos.

A small Vite app that mounts one custom element per feature area (`demo-*-section` tags in
[`index.html`](./feature-demo/index.html)). Each section’s source lives under [`feature-demo/sections/`](./feature-demo/sections/).

## Browser bundle only (no Vite on std-ui)

Prebuilt `dist/browser/` bundles loaded directly live in [`browser-bundle/`](./browser-bundle/) (static pages, served by `npm run demo`).

See [`browser-bundle/README.md`](./browser-bundle/README.md).

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

## `bind()` demo (dedicated page)

Two-way property binding — native form fields and a custom element with `level-change`:

```bash
npm run demo
```

Open [http://localhost:5174/feature-demo/bind.html](http://localhost:5174/feature-demo/bind.html). Sources: [`feature-demo/bind.html`](./feature-demo/bind.html), [`feature-demo/sections/bind/`](./feature-demo/sections/bind/).

API notes: [`../std-ui/src/element/template/directives/bind/README.md`](../std-ui/src/element/template/directives/bind/README.md).

## `virtualize` demo (dedicated page)

Large-list examples live on a separate page so the main tour stays short:

```bash
npm run demo
```

Then open [http://localhost:5174/feature-demo/virtualize.html](http://localhost:5174/feature-demo/virtualize.html) (or use the link on the home page). Sources: [`feature-demo/virtualize.html`](./feature-demo/virtualize.html), [`feature-demo/sections/virtualize/`](./feature-demo/sections/virtualize/).

| Block | Module | What it shows |
|-------|--------|----------------|
| Vertical | [`feature-demo/sections/virtualize/vertical-section.ts`](./feature-demo/sections/virtualize/vertical-section.ts) | 10k fixed-height rows, `VirtualizeController` / `scrollToIndex` |
| Headers | [`feature-demo/sections/virtualize/headers-section.ts`](./feature-demo/sections/virtualize/headers-section.ts) | Variable heights, `isHeader` sticky sections |
| Grid | [`feature-demo/sections/virtualize/grid-section.ts`](./feature-demo/sections/virtualize/grid-section.ts) | `lanes: 4` grid |
| Horizontal | [`feature-demo/sections/virtualize/horizontal-section.ts`](./feature-demo/sections/virtualize/horizontal-section.ts) | `direction: 'horizontal'` |

API notes: [`../std-ui-ext/src/directives/virtualize/README.md`](../std-ui-ext/src/directives/virtualize/README.md).

## Sections

| Tag | Module | What it shows |
|-----|--------|----------------|
| `demo-counter-section` | [`feature-demo/sections/counter-section.ts`](./feature-demo/sections/counter-section.ts) | Signals, `UIElement`, `template()` |
| `demo-attribute-section` | [`feature-demo/sections/attribute-section.ts`](./feature-demo/sections/attribute-section.ts) | `@attribute()` |
| `demo-context-section` | [`feature-demo/sections/context-section.ts`](./feature-demo/sections/context-section.ts) | `@consume()` / `@provide()` |
| `demo-query-section` | [`feature-demo/sections/query-section.ts`](./feature-demo/sections/query-section.ts) | `@query()` |
| `demo-shadow-section` | [`feature-demo/sections/shadow-section.ts`](./feature-demo/sections/shadow-section.ts) | Shadow DOM + `static styles` |
| `demo-css-section` | [`feature-demo/sections/css-section.ts`](./feature-demo/sections/css-section.ts) | `css` tagged styles in light DOM |
| `demo-directives-section` | [`feature-demo/sections/directives-section.ts`](./feature-demo/sections/directives-section.ts) | `classMap`, `styleMap`, `html` |
| `demo-bindings-section` | [`feature-demo/sections/bindings-section.ts`](./feature-demo/sections/bindings-section.ts) | Event modifiers (`.once`/`.prevent`/`.stop`/`.self`), `class:name`, `style:prop` |
| `demo-todo-section` | [`feature-demo/sections/todo-section.ts`](./feature-demo/sections/todo-section.ts) | Composition; positional list via `.map()` |
| `demo-map-by-key-section` | [`feature-demo/sections/map-by-key-section.ts`](./feature-demo/sections/map-by-key-section.ts) | Keyed lists via `mapByKey` (sort + checkboxes) |

## `mapByKey` — sortable chore list

The **Keyed lists** section is the browser counterpart to the Lit-style `repeat()` tutorial: sort
with **A → Z** / **Z → A**, tick a checkbox on one row, then sort again. The box should stay on the
same chore because `mapByKey` reconciles by `id`. Compare with **todo list** above, which uses
`this.todos().map(...)` and is fine for append/remove but would mis-attach control state if you reordered.

- Live UI: run the demo and scroll to **Keyed lists (`mapByKey`)**.
- Automated check: from `src/std-ui`, `npm test -- map-by-key-sort.example` (see [`../std-ui/src/doc/map-by-key-sort.example.test.ts`](../std-ui/src/doc/map-by-key-sort.example.test.ts)).
- API notes: [`../std-ui/src/element/template/directives/map-by-key/README.md`](../std-ui/src/element/template/directives/map-by-key/README.md).
