# Browser bundle demos

Static pages that load the built `std-ui.iife.min.js` directly — **no bundler processes std-ui**. They are served by the normal demo server (`npm run demo`, then open `/browser-bundle/index.html`) and also work from `file://`.

## Updating the bundle

`std-ui.iife.min.js` here is a copy of [`../../std-ui/dist/browser/std-ui.iife.min.js`](../../std-ui/dist/browser/). After changing the library, refresh it:

```bash
npm run build
copy dist\browser\std-ui.iife.min.js demo\browser-bundle\   # PowerShell / cmd
```

## Files

| File | Role |
|------|------|
| [`index.html`](./index.html) + [`app.js`](./app.js) | IIFE bundle via classic `<script>` + the `StdUI` global; plain JS, no decorators |
| [`babel.html`](./babel.html) | IIFE bundle + `@babel/standalone`, so `@tag` / `@attribute` / `@state` work in an inline script (~2.9 MB Babel download — demo only) |
| `std-ui.iife.min.js` | Copy of the built bundle |

## Decorators

Browsers can't parse `@decorator` syntax, so your own class code must be compiled: ahead of time (TypeScript/esbuild, as in the other demos) or in the page with Babel (`babel.html`). `index.html` avoids the problem with `customElements.define`.

Load order matters in `babel.html`: the std-ui IIFE first (it defines `Symbol.metadata`), then Babel, then your script.

See [`../../std-ui/doc/build.md`](../../std-ui/doc/build.md) for the bundle formats.
