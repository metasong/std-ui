# Build

| Script | Output |
|---|---|
| `npm run build` | Cleans `dist/`, then runs both steps below |
| `tsc -p tsconfig.build.json` | Per-module ESM + `.d.ts` in `dist/` (the npm package entry points) |
| `npm run build:bundle` | Single minified browser bundles in `dist/browser/` (config: [`vite.bundle.config.ts`](../vite.bundle.config.ts)) |

`dist/browser/` contains two self-contained files (no dependencies), each with a source map:

| File | Format | Minified | Gzip | Brotli |
|---|---|---|---|---|
| `std-ui-core.min.js` | ES module | 48.6 kB | 14.6 kB | 13.0 kB |
| `std-ui-core.iife.min.js` | IIFE (global `StdUI`) | 36.8 kB | 12.8 kB | 11.6 kB |

Current numbers: `npm run build:bundle`, then `node scripts/size-map.mjs` (writes `demo/pages/size-map/bundle-sizes.json`).

## Differences

Both files contain the same code from `src/index.ts`. Only the wrapper differs:

- **ES module** ends with `export { ... }` and keeps the export names. Names that are exported cannot be mangled, and the output is not fully whitespace-minified (Vite does not minify `es` library output the same way), so it is about 12 kB larger raw and ~1.4 kB larger Brotli.
- **IIFE** wraps everything in `var StdUI = (function (e) { ... })({})`. Everything is internal to the closure, so it minifies harder, and it assigns the public API onto one global, `StdUI`.

| | ES (`std-ui-core.min.js`) | IIFE (`std-ui-core.iife.min.js`) |
|---|---|---|
| Loaded with | `<script type="module">`, `import`, import map | classic `<script src>` |
| API access | `import { t, render } from '...'` | `const { t, render } = StdUI` |
| Works from `file://` | No (module scripts need http/https, CORS) | Yes |
| Globals | None | One: `StdUI` |
| Tree-shaking by a bundler | Possible (though the file is pre-bundled) | No |
| Size | Larger | Smaller |
| Can be imported by other modules | Yes | No |

## When to use which

Use **IIFE** when:
- Dropping std-ui into a plain HTML page with a single `<script>` tag, no build step, or opening the page from `file://`.
- Working in CodePen, CMS templates, or other places where you can't use modules.
- You want the smallest possible download.

Use **ES module** when:
- Your page already uses `<script type="module">` and you want `import` syntax with no global.
- You use an import map, or load std-ui alongside other ES modules.
- You want to avoid adding a global.

Use **neither** (install from npm) when you have a bundler (Vite, webpack, esbuild). Import `@std-ui/core` directly: the per-module ESM in `dist/` tree-shakes better than either pre-bundled file.

Examples:

```html
<!-- ES module -->
<script type="module">
  import { store, t, render } from './dist/browser/std-ui-core.min.js';
</script>

<!-- IIFE -->
<script src="./dist/browser/std-ui-core.iife.min.js"></script>
<script>
  const { state, t, render } = StdUI;
</script>
```

Runnable example: [`demo/browser-bundle/`](../demo/browser-bundle/) (served by `npm run demo`).
