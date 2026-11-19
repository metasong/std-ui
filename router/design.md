# @std-ui/router — design

Client-side router for std-ui. Standards-first: **Navigation API**, signals, custom elements.

## Decisions

| Area | Decision | Why |
|---|---|---|
| Package | Separate `@std-ui/router`; peer `@std-ui/core` | Apps without routing pay nothing. `ext` stays small. |
| Navigation | **Navigation API required** (`window.navigation`). No History API fallback. `new Router()` throws without it. | One code path. The `navigate` event replaces link interception, popstate bookkeeping and scroll/focus code. |
| SSR | Out of scope | Keeps the matcher and elements DOM-only. |
| Route sources | Config table (`createRouter({ routes })`), `<std-route>` markup, or both | Markup suits the no-compiler browser bundle. Config suits typed apps. Both compile to the same `RouteDef` tree. |
| Matching | Own matcher (`match/matcher.ts`) | `URLPattern` is not in jsdom and not universal. A native-`URLPattern` backend is a possible later swap behind `matchRoutes`. |
| Context | Elements find the router by DOM ancestry (`findAncestor`, crossing shadow roots) | No `@std-ui/ext` dependency. A context-based lookup can replace it later without API change. |

## What the Navigation API gives us

- **No link interception.** The `navigate` event fires for `<a>` clicks, form GETs, `location` changes, back/forward and `navigation.navigate()`. The router calls `event.intercept({ handler })` for same-origin, non-hash, non-download navigations inside `base`.
- **Scroll and focus** are handled by the browser when the intercept handler's promise settles. No custom scroll restoration.
- **Cancellation**: `event.signal` aborts when a newer navigation starts. The router ties its own `AbortController` to it and drops stale results by sequence number.
- **Redirects** are `navigation.navigate(url, { history: 'replace' })` from inside the handler, so the redirected-from URL does not stay in history.
- **Programmatic API** (`router.navigate/back/forward`) is a thin wrapper over `navigation.*`.

### Guards and `precommitHandler`

Redirect attributes, `beforeLeave` hooks and route guards run in one place: the router's `precommitHandler` (`Router#check`). A block rejects, which cancels the navigation before the URL commits. A redirect uses `controller.redirect()` and re-checks the target (hops capped). The router contains no other path.

Native support is limited (checked Nov 2026): Chrome/Edge 146+, Firefox 148+, **no Safari**. `navigation/precommit-shim.ts` (`withPrecommit`) papers over that so router code is written only against the native API:

| Engine | What happens |
|---|---|
| Native `NavigationPrecommitController` | `withPrecommit` returns `navigation` untouched. |
| Otherwise | The shim wraps `navigation`. `precommitHandler` runs as the first step of `handler` (after commit); a rejection reverts the entry (`traverseTo(prevKey)` / `back()` / `navigate(prevUrl, replace)`) and rethrows; `redirect()` re-navigates with `history: 'replace'` and runs the original `handler` for the target. Navigations the shim starts are hidden from the router's listener. Events are presented as cancelable so the router needs no special case. |

Still inside the Navigation API, not a History fallback. Delete the shim when Safari ships `precommitHandler`. Tests run both modes by stubbing the `NavigationPrecommitController` global.

### `beforeLeave(hook)`

`router.beforeLeave(({ from, to, signal }) => boolean | void | Promise<...>)` returns an unregister function. `false` blocks. Hooks run before route guards, only for router-handled navigations (not the initial resolve or re-resolves after route registration), and once per user navigation even if a guard redirects. The router has no dependency on `@std-ui/ext`; a dirty-form guard is one line against ext's change tracking:

```ts
const form = changes(state({ name: '' }));
router.beforeLeave(() => !form.changes.dirty.peek() || confirm('Discard changes?'));
```

#### Tab close / reload

Tab close, reload and cross-origin navigation never reach the Navigation API's intercept, and `beforeunload` is synchronous with no custom UI, so the async hook cannot serve it. Pass a sync predicate instead:

```ts
router.beforeLeave(
  () => !form.changes.dirty.peek() || confirm('Discard changes?'),
  { unload: () => form.changes.dirty.peek() },
);
```

While the router is started and any registered hook's `unload()` returns true, the router calls `preventDefault()` (and sets `returnValue = ''`) on `beforeunload`, so the browser shows its generic prompt. The listener is attached only while started and at least one hook has an `unload` check, and removed on unregister or `stop()`.

## Route model

```ts
interface RouteDef {
  path?: string;          // relative to parent: 'users', ':id', ':id?', '*'
  index?: boolean;        // matches parent path exactly
  element?: string;       // tag name rendered by <std-outlet>
  template?: HTMLTemplateElement; // static content when no element
  lazy?: () => Promise<unknown>;  // awaited before commit (dynamic import)
  load?: (ctx) => unknown;        // result exposed via router.data()
  guard?: (ctx) => boolean | string | void | Promise<...>; // false blocks, string redirects
  redirect?: string;      // ':param' substituted
  errorElement?: string;
  title?: string;
  meta?: Record<string, unknown>;
  children?: RouteDef[];
}
```

Ranking among siblings: `index` first, then per segment static > `:param` > `*`; ties keep declaration order.
All paths given to the router API (`navigate`, `redirect`, guard results) are **app-relative** (no `base`). `base` is added and stripped at the Navigation API boundary.

## Pipeline (`Router#resolve`)

1. Abort the previous navigation, bump sequence, `status = 'loading'`.
2. Match the pathname into a root-to-leaf chain (empty chain = not found).
3. `redirect` on any matched route → replace-navigate and stop.
4. Guards root → leaf (awaited in order). `string` → redirect, `false` → revert and stop.
5. `lazy()` then `load()` for every matched route in parallel.
6. If superseded, stop. Otherwise commit `location`, `matches`, `data`, `error`, `status` and `document.title`.
7. A thrown guard/loader error commits with `status = 'error'` and `error` set so `errorElement` can render.

State is signals (`location`, `matches`, `data`, `error`, `status`, computed `params`).

## Module layout (`src/router/`)

| File | Responsibility |
|---|---|
| `router.ts` | Reactive state (signals), Navigation API wiring, publishing a resolved navigation. |
| `intercept.ts` | `interceptWithGuards`: the `precommitHandler` (check, redirect loop, block) and `handler` split. |
| `route-table.ts` | Config + runtime-registered routes; notifies on change. |
| `base-path.ts` | `base` stripping/adding. |
| `guards.ts` | `checkNavigation`: redirect attrs, `beforeLeave`, route guards → `Verdict`. |
| `leave-hooks.ts` | `beforeLeave` registry and the `beforeunload` prompt. |
| `loader.ts` | `lazy()` + `load()` for matched routes. |
| `abort.ts` | AbortError helpers. |

Matching lives in `match/`, the Navigation API view and shim in `navigation/`, test support in `dev/`.

## Elements

```html
<std-router base="/app">
  <std-route path="/" element="home-page"></std-route>
  <std-route path="/users" element="users-layout">
    <std-route index element="users-index"></std-route>
    <std-route path=":id" src="/pages/user-page.js" element="user-page"></std-route>
  </std-route>
  <std-route path="/about"><template><h1>About</h1></template></std-route>
  <std-route path="/old" redirect="/users"></std-route>
  <std-route path="*" element="not-found-page"></std-route>
  <std-outlet></std-outlet>
</std-router>
```

- `<std-router>`: owns the `Router` (lazy `router` getter). Properties `routes` and `navigation` must be set before connecting. Starts in a microtask so child `<std-route>`s register first.
- `<std-route>`: inert (`hidden`). Builds its `RouteDef` lazily (`def`) so a child can reach its parent's def before the parent connects. Attributes are read once. Behaviour via properties: `guard`, `load`. Attributes: `path`, `index`, `element`, `src`, `redirect`, `error-element`, `title`, `meta-*`, child `<template>`. Registers on connect, unregisters on disconnect; the router re-resolves in a microtask.
- `<std-outlet>`: depth = number of ancestor outlets. Renders `matches()[depth]`, reusing the element while the route and tag are unchanged and updating its `params`, `data`, `error`, `route` properties.
- Define order matters: `<std-router>` before the others (see `element/index.ts`; listed in `sideEffects`).

## Testing

jsdom has no Navigation API. `createMemoryNavigation()` implements the subset in `navigation/types.ts` (commit-before-handler, abort on supersede, `traverseTo`) and is passed as `navigation` to `createRouter` / `<std-router>`. All test-support code lives in `src/dev/`; its `index.ts` is the `@std-ui/router/testing` entry and is never re-exported from the main entry. It approximates the spec, so revert/abort behaviour is unverified in a real engine (see roadmap).

## Roadmap

- [x] Matcher, nested/index/redirect, ranking
- [x] Router core on Navigation API: signals, guards, loaders, cancellation, revert, `base`
- [x] `<std-router>`, `<std-route>`, `<std-outlet>`
- [x] `beforeLeave` hooks; `precommitHandler` when supported (revert path otherwise)
- [x] `beforeunload` guard for tab close / reload (`beforeLeave(hook, { unload })`)
- [ ] `@routeParam` / `@searchParam` decorators (needs `ext`; avoid the name `query`, taken by DOM query decorators)
- [ ] Dev warnings (unmatched route, redirect loop), live-region announcer, view transitions
- [ ] Demo section under `demo/feature-demo/sections/router/`
- [ ] Real-browser test run (vitest browser mode) to validate guard revert and supersede against a real Navigation API
- [ ] Optional `URLPattern` backend; context-based router lookup
