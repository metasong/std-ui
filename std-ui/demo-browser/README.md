# Browser bundle demos

Pages that load the built artifacts in [`../dist/browser/`](../dist/browser/) directly — **no bundler processes std-ui**.

## Run

From [`src/std-ui`](../) (package root):

```bash
npm run build
npm run demo:browser
```

Opens [http://localhost:5175/demo-browser/index.html](http://localhost:5175/demo-browser/index.html). The server root is `src/std-ui`, so `dist/` must exist (run `npm run build` first) or the pages stay blank.

## Files

| File | Role |
|------|------|
| [`index.html`](./index.html) + [`app.js`](./app.js) | IIFE bundle (`std-ui.iife.min.js`) via classic `<script>` + the `StdUI` global; plain JS, no decorators. Also works from `file://`. |
| [`babel.html`](./babel.html) | IIFE bundle (`std-ui.iife.min.js`) + `@babel/standalone`, so `@tag` / `@attribute` / `@state` work in an inline script (~2.9 MB Babel download — demo only) |
| [`vite.config.ts`](./vite.config.ts) | Static file server only (ES modules need `http://`, not `file://`) |

## Decorators

Browsers can't parse `@decorator` syntax, so your own class code must be compiled: ahead of time (TypeScript/esbuild, as in [`../demo/`](../demo/)) or in the page with Babel (`babel.html`). `index.html` avoids the problem with `customElements.define`.

Load order matters in `babel.html`: the std-ui IIFE first (it defines `Symbol.metadata`), then Babel, then your script.

See [`../doc/build.md`](../doc/build.md) for the bundle formats.
