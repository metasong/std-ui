# Plan: ahead-of-time template compiler

Status: draft. Nothing is implemented yet.

## Goal

Introduce a build-time compiler, in the spirit of Svelte, that moves the static work of the template
system out of the browser. The tagged-template API (`t`, `svg`, `math`) stays valid. Uncompiled
templates must keep working through the runtime path.

## Principle: precompile is opt-in

The runtime build stays the default and the reference behaviour. Precompiling is an optional
optimization the user turns on.

- **Without the compiler plugin:** nothing changes. `t\`\`` templates are scanned and parsed at first
  render, exactly as today. No new required dependency, config or build step.
- **With the plugin:** the compiler rewrites templates it can handle. Anything it can't handle is left
  as plain `t\`\``, and the runtime builds it as before. Compiled and uncompiled templates can be mixed
  freely in one app, even in one file.
- **Core stays independent of the compiler.** `@std-ui/core` must not import `@std-ui/compiler`. The only
  core change is a small, tree-shakeable entry that accepts a prebuilt template. Core must work and its
  tests must pass when that entry is never used.
- **Same semantics either way.** Compiled output must behave identically to the runtime build. The
  parity suite in Phase 1 enforces it.
- **Per-template escape hatch:** a comment or option (for example `/* @std-ui-no-compile */` or an
  `exclude` list) skips a template or file.
- **Not a breaking change:** the compiler is a separate package, so existing users, the CDN/IIFE bundles
  and the demo keep the runtime build unless they add the plugin.

## Enabling the compiler (proposal)

Add the plugin to the build config. Omit it and nothing changes.

```ts
// vite.config.ts
import { stdUiCompiler } from '@std-ui/compiler/vite';

export default defineConfig({
	plugins: [esbuildTs(), stdUiCompiler({ exclude: ['**/legacy/**'] })],
});
```

- The same compiler core also ships as an esbuild plugin and a CLI.
- `/* @std-ui-no-compile */` before a template, or the `exclude` option, skips it.
- Core needs only a small entry that accepts a prebuilt template. It is never imported without the plugin.
- Options by feature, all default off except `templates` once the plugin is added:
  `stdUiCompiler({ templates: true, styles: false, extractCss: false })`.

### Dynamic templates stay supported

Enabling the compiler never removes the runtime builder. Compiling is an optimization, not a restriction.
Some templates can't be compiled statically: a tag that isn't a plain `t`/`svg`/`math` from `@std-ui/core`,
a third-party library that ships `t\`\``, or a `strings` array built at runtime.

| Option | Default | Behaviour |
|---|---|---|
| (none) | on | An uncompilable template silently falls back to the runtime path. In DEV the build prints one note, e.g. `not compiled: dynamic tag at file:line`. |
| `strict: true` | off | Fail the build for an uncompilable template in the user's own code. A lint for CI that wants full precompilation. It does not change runtime behaviour. |
| `runtimeBuilder: false` | off | Size-focused build: the scanner and parser are tree-shaken out. A template that reaches `getTemplate` without a prebuilt entry throws a clear `usageError`. For apps whose own code and dependencies are all compiled. |

So the default is compiled when possible and runtime otherwise. `strict` and `runtimeBuilder: false`
are opt-in guarantees on top of that.

Implication for core: the scanner and parser must be separable so `runtimeBuilder: false` can drop them.
The prebuilt-template entry must not import them.

## What Svelte's compiler does, and what applies here

| Svelte does | std-ui today | Compiler scope |
|---|---|---|
| Template to DOM-creation code | Runtime scan, parse, clone | Phases 1-2 |
| Reactivity (`$state`, `$derived` to signals/effects) | Runtime `signal`/`state`, whole `render()` re-runs, parts diff | Deferred (Phase 3): signals stay explicit |
| Scoped CSS: hashed class and selector rewrite | Shadow DOM scopes, or `@scope (tag)` for light DOM, applied at runtime in `element-styles.ts` | Phase 2b below: no hashing needed |
| CSS extraction, minify, prune unused selectors | `css\`\`` builds a `CSSStyleSheet` at runtime via `replaceSync` | Phase 2b |
| Compile-time warnings (a11y, unused CSS, bad syntax) | Template errors only at first render, DEV warnings at runtime | Phase 4 diagnostics |
| SSR output and hydration | None | Out of scope for now. Revisit later: the prebuilt template (static HTML + descriptors) is a good base. |
| Dead-code elimination of unused runtime features | Scanner, sigils and directives all bundled | Falls out of Phase 1 (scanner dropped) and Phase 2 (unused `Part` kinds dropped) |
| Single-file component format (`.svelte`) | Class + `static styles` + `t\`\`` | Not planned (see Phase 0, decision 1) |
| Component props/events/transitions compiled | `@attribute`, decorators, runtime | Out of scope |

## Current pipeline (see `src/core/src/element/template/factory/design.md`)

```
strings ──scan──► markup + descriptors ──innerHTML──► <template> ──resolveIndices──► Template{element, parts[]}   (cached per `strings`)
Template ──cloneNode──► TreeWalker (nodeIndex -> Node) ──createPart(descriptor, node)──► Part[] ──updateParts(values)
```

- Everything up to `Template{...}` depends only on the static `strings`, so it can run at build time.
  The only DOM dependency is `document.createElement('template').innerHTML` (and `resolveIndices`), which
  the compiler replaces with its own HTML parser.
- Today the work happens on the first `render()` of each template and ships `markup-scanner`,
  `raw-text`, `resolve-indices`, the sigil regex and the custom-attribute lookup in every bundle.
- At runtime `instantiate` walks the clone with a `TreeWalker` and builds generic `Part` objects.
  A compiler can remove the walk and much of the dispatch.

## Decisions needed (Phase 0)

| # | Question | Recommendation |
|---|---|---|
| 1 | Input format: compile `t\`\`` in `.ts`, or a new Svelte-style single-file format? | Compile tagged templates first. A new file format can come after the compiler core exists. |
| 2 | Reactivity: compile-time reactive effects per `${expr}`, or keep `update(values)`? | Decided: keep explicit signals and `update(values)`. Compile-time reactivity is deferred (Phase 3). |
| 3 | Tooling host | A Vite plugin (already on Vite 8 with the `esbuild-ts` plugin), with an esbuild plugin and a CLI sharing the same core. |
| 4 | Default mode | Decided: runtime build is the default, precompile is opt-in (see Principle above). |
| 5 | Dynamic templates when compiling | Decided: still supported by default. `strict` and `runtimeBuilder: false` are opt-in (see "Dynamic templates stay supported"). |
| 6 | Build dependencies | Decided: `parse5` (normal) and `lightningcss` (optional peer), compiler package only (see "Build dependencies"). |
| 7 | Prebuilt template cache key | Recommended, not yet confirmed: keep the compiled `strings` identity as the key, so `getTemplate` and `render()` need no change. |
| 8 | Do `@std-ui/ext` and `@std-ui/router` ship precompiled? | Recommended, not yet confirmed: no, not in Phase 1. Published output would depend on the prebuilt format, which needs a version first. Decide once the format is stable. |
| 9 | Package location | Recommended, not yet confirmed: `src/compiler` as a fourth workspace next to `core`, `ext` and `router`. |
| 10 | Phase 2 gating | Recommended, not yet confirmed: start Phase 2 only after benchmarking Phase 1. |
| 11 | Phase 2b scope | Recommended, not yet confirmed: first version does static folding and minify. Defer `extractCss`. |

Rows 1, 3 and 7-11 are recommendations awaiting confirmation. Nothing is implemented yet.

## Build dependencies (decided)

Both belong to `@std-ui/compiler` only, never to `@std-ui/core`. They run at build time and never reach
shipped JavaScript. Users who don't add the plugin install neither.

| Package | Used for | How it is declared |
|---|---|---|
| `parse5` | Phase 1: spec-compliant HTML parsing in Node, replacing `document.createElement('template').innerHTML` to compute `nodeIndex` | Normal dependency. Phase 1 cannot work without it. |
| `lightningcss` | Phase 2b: minify and prefix `css\`\`` output | Optional peer dependency, needed only with `styles: true`. It ships a native binary per platform, so template-only users do not download it. |

Alternatives rejected: `jsdom`/`linkedom` (heavier, a fake DOM we don't need) and a hand-written parser
(the HTML5 rules for `<table>`, `<select>` and implied end tags are subtle). `jsdom` is already a dev
dependency for tests and uses `parse5` internally.

## Phase 1: precompiled templates (no behaviour change)

- New package `@std-ui/compiler` (`src/compiler`) with a pure `compile(source, id) -> { code, map }`.
- Detect `t` / `svg` / `math` tagged templates imported from `@std-ui/core`, including aliases. A dynamic
  or unresolvable tag is left untouched.
- Reuse the scanner. `markup-scanner.ts` and `raw-text.ts` are pure string logic. Make them importable
  from Node, and make `parseBinding` / `describeBinding` in `factory.ts` callable without touching
  `document` (`registerBuiltinCustomAttributes` must not need the DOM).
- Replace `innerHTML` + `resolveIndices` with a build-time parse (`parse5`) that computes `nodeIndex`
  identically. Port the SVG/MathML wrap and unwrap, and match the HTML parser rules for `<table>`,
  `<select>` and implied end tags.
- Emit a hoisted prebuilt template, for example:
  ```ts
  const _tpl0 = prebuilt(`<p><!--std-ui-part--></p>`, [{ kind: 1, nodeIndex: 1, valueCount: 1 }]);
  ```
  Add a small runtime entry so `getTemplate` accepts a prebuilt template (cache keyed by the compiled
  `strings` identity or the template object).
- Payoff: no scan or parse at first render, and the scanner can be tree-shaken from production bundles.

**Acceptance**
- For every template in the existing tests and in `demo/`, the runtime-built template equals the
  compiled one (same HTML, same descriptors). This is the parity suite.
- `npm test` passes with the compiler on and off. The default test run uses no compiler.
- A mixed file (one compiled template, one skipped) renders correctly.
- `npm run size` shows the bundle delta for the demo.

## Phase 2: generated instantiate and update code

- Emit one function per template that clones the template node and reaches nodes by static paths
  (`firstChild.nextSibling...`). This removes the `TreeWalker` and the `nodeIndex` array.
- Generate inline code for plain attribute, property, boolean and event bindings, with per-slot
  previous-value checks, skipping the `Part` classes for built-in kinds.
- Keep generic `Part`s and directives as the fallback: registered `CustomAttribute` sigils, `ref`, `bind`,
  `mapByKey`, `virtualize`. The public `Directive` interface does not change.
- Keep the `render()` lifecycle: `unmount`, `disconnectRendered`, `dispose`. A compiled instance exposes
  the same part-like lifecycle.

**Acceptance:** existing tests pass unchanged. Benchmark first-render and update cost against Phase 1.

## Phase 2b: styles (`css` tagged templates, opt-in via `styles: true`)

Today `css\`...\`` is resolved at runtime: `CSSResult.styleSheet` runs `new CSSStyleSheet().replaceSync(cssText)`,
and `ElementStyles` wraps light-DOM styles in `@scope (tag) { ... }` and rewrites `:host` to `:scope` when
the element first renders. Scoping is already done by the shadow boundary or `@scope`, so unlike Svelte
there is no class hashing to compile.

What the compiler can do for static `css\`\`` literals:
- **Resolve at build time:** fold nested `${otherCss}` references and numbers into one string. Leave
  `unsafeCss(...)` and other dynamic values as runtime code.
- **Pre-scope:** emit the `@scope (tag)` wrapper and the `:host` to `:scope` rewrite ahead of time for
  classes known to render in light DOM. Needs the tag name, so only when `@tag('...')` and `static styles`
  are statically visible in the same file, otherwise keep the runtime path.
- **Minify and prefix:** run the CSS through `lightningcss` (or similar) at build time.
- **Optional extraction (`extractCss: true`):** emit a `.css` file and load it, instead of inlining the text.
  Light DOM only at first, since shadow roots still need a constructable sheet or `<style>` per root.
- **Diagnostics:** warn on CSS syntax errors and, as a stretch goal, unused selectors checked against the
  component's template.
- Parity: `ElementStyles` receives equivalent `CSSResult`s, so the runtime fallback and the compiled path
  produce the same applied rules. Add tests comparing the resulting sheet text.

Phase 2b is independent of Phase 2 and can ship before or after it.

## Phase 3: compile-time reactivity (deferred)

**Decision: do not compile reactivity for now.** Signals stay explicit. Revisit only if benchmarks after
Phase 2 show the whole-template re-run matters.

How it works today: `UIElement` runs one render effect around `template()`. Any signal read inside it
re-runs the template function, and `render()` diffs only the values through the parts (no vdom). Fine-grained
effects already exist through `this.effect(...)`. Re-rendering is done by writing a signal
(`doc/why-no-request-update.md`).

Why not compile it:
1. **No reactive syntax to compile.** Svelte rewrites `count` to `get(count)` because `$state` is a rune the
   compiler knows. std-ui signals are plain TypeScript objects, so the compiler would have to infer what is
   reactive from types or call patterns. That is fragile and breaks the "same semantics with or without the
   compiler" rule.
2. **Conflicts with opt-in.** The runtime path tracks one whole-template effect, a compiled path would
   track one per slot. Ordering, batching and `whenFlushed` could differ, giving bugs that only appear
   with the compiler on.
3. **Small gain.** The cost is bounded by the slot count of one template, and unchanged values are skipped.
4. **Large cost.** It needs a new language rule, type-aware analysis and its own design doc.

What to do instead:
- **Phase 2 gets most of the win.** Generated inline update code with previous-value checks makes each
  re-run cheaper without changing when things run.
- **Only candidate design, if ever needed: an explicit helper**, e.g. `${$(count)}` or `${bind(count)}`,
  which the compiler turns into a dedicated per-slot effect. Plain `${expr}` keeps the whole-template
  behaviour. Nothing is inferred, the opt-in is visible in the code, and an uncompiled build runs the helper
  through a small runtime implementation, so semantics match.
- **Gate:** profile large lists and frequently updating slots after Phase 2 before designing anything. If
  pursued, write a separate design doc first.

## Phase 4: tooling

- Vite plugin with source maps, HMR (template edits re-render without a full reload), and build-time
  diagnostics. Reuse the `usageError` messages as build errors with file and line.
- Keep DEV warnings such as `warnOnUndefinedElements` in the runtime, or move them to a lint where possible.
- Dogfood in `demo/vite.config.ts` first, then the `build:bundle` and `build:release` configs of `@std-ui/core`.

## SSR (future, out of scope)

SSR is not part of this plan, but the compiler gives it a good starting point, so Phases 1-2 should not
close the door.

Why the compiler helps:
- **No DOM needed.** The runtime builder uses `document.createElement('template').innerHTML`, so a server
  would need a DOM shim. The Phase 1 build-time parse (`parse5`) produces a prebuilt template (static HTML +
  descriptors) that can be turned into an HTML string without a DOM.
- **Hydration anchors exist.** Text slots are `<!--std-ui-part-->` comments and `nodeIndex` is a stable walk
  order over elements and comments. Server output with the same markers could be matched to descriptors by
  the same walk, adopting existing nodes instead of cloning.
- **Phase 2 could get a server variant:** a string-concatenating render function from the same analysis.

What the compiler does not solve:
- **Custom elements and `UIElement`.** Needs a defined story (declarative shadow DOM or a server element
  runtime). `connect`, `@query` and other decorators assume a browser.
- **Styles.** `adoptedStyleSheets` does not exist on the server. Output would need `<style>` inside the
  declarative shadow root, or inlined light-DOM CSS. Phase 2b's build-time CSS text helps.
- **Hydration of parts.** `bind`, `virtualize`, `mapByKey` and others would each need an "adopt existing
  DOM" path, and signal state would need serializing.

Constraints to keep SSR possible:
1. The prebuilt template format stays DOM-free and serializable (plain data, no DOM nodes).
2. The marker and `nodeIndex` rules stay stable and documented (see `factory/design.md`).
3. Compiled output does not touch browser globals at import time.

## Risks

- **Parser parity:** `parse5` and the browser must agree. Mitigated by golden and parity tests in Phase 1.
- **Dynamic templates:** non-literal `strings` can't be compiled, so the runtime fallback stays supported.
- **Extensibility:** `CustomAttribute` and `Directive` are runtime extension points. Only built-ins are
  specialized, everything else goes through the runtime path.
- **Package layout:** compiled output must import from public entry points (`@std-ui/core`, `@std-ui/ext`),
  not internal paths.

## Next step

Answer the Phase 0 questions, then start Phase 1: create `src/compiler`, add the prebuilt-template entry
to the factory, and write the parity tests.
