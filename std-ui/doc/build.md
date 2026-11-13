# Build

| Script | Output |
|---|---|
| `npm run build` | Cleans `dist/`, then runs both steps below |
| `tsc -p tsconfig.build.json` | Per-module ESM + `.d.ts` in `dist/` (the npm package entry points) |
| `npm run build:bundle` | Single minified browser bundles in `dist/browser/` (config: [`vite.bundle.config.ts`](../vite.bundle.config.ts)) |

`dist/browser/` contains two self-contained files (no dependencies), each with a source map:

| File | Format | Minified | Gzip |
|---|---|---|---|
| `std-ui.min.js` | ES module | 76.4 kB | 21.9 kB |
| `std-ui.iife.min.js` | IIFE (global `StdUI`) | 59.0 kB | 20.1 kB |

Sizes as of v0.1.0; `npm run build:bundle` prints current numbers. The ES build is larger because its top-level export names can't be mangled.

- `std-ui.min.js` — ES module:

  ```html
  <script type="module">
    import { signalState, t, render } from './dist/browser/std-ui.min.js';
  </script>
  ```

  Runnable example: [`demo/browser-bundle/`](../demo/browser-bundle/) (served by `npm run demo`).

- `std-ui.iife.min.js` — classic script exposing the global `StdUI`:

  ```html
  <script src="./dist/browser/std-ui.iife.min.js"></script>
  <script>
    const { signalState, t, render } = StdUI;
  </script>
  ```

Vite does not whitespace-minify `es` library output, so the config includes a small `renderChunk` plugin that minifies it with esbuild.
