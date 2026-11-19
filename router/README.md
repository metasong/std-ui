# @std-ui/router

Client-side router for std-ui on the **Navigation API** (required; no History fallback, no SSR). Design and mental model: [design.md](./design.md).

A navigation is a transaction: **Plan** (redirects, `beforeLeave`, guards) → **Load** (`lazy` + `load`) → **Commit** (publish signals).

## Markup

```html
<std-router base="/app">
  <a href="./users/3">User 3</a>
  <std-route path="/" element="home-page"></std-route>
  <std-route path="/users" element="users-layout">
    <std-route index element="users-list"></std-route>
    <std-route path=":id" element="user-page" id="user-route"></std-route>
  </std-route>
  <std-route path="/old" redirect="/users"></std-route>
  <std-route path="*"><template><h1>Not found</h1></template></std-route>
  <std-outlet></std-outlet>
</std-router>
```

Behaviour that is not an attribute is set as properties on the `<std-route>` element:

```ts
const user = document.getElementById('user-route') as StdRoute;
user.guard = ({ params }) => (signedIn() ? true : '/login'); // true | false | redirect path
user.load = async ({ params, signal }) => fetchUser(params.id, signal); // -> outlet `data`
```

Outlets set `params`, `data`, `error` and `route` on the element they render. Use `error-element` on a route for its failure page.

## Config / code

```ts
import '@std-ui/router';
import { createRouter } from '@std-ui/router';

const router = createRouter({ routes: [{ path: 'users/:id', element: 'user-page' }] });
await router.start();
router.navigate('/users/3');
router.params(); // { id: '3' }; also location(), matches(), status(), error(), data()
```

Matching: static > `:param` > `*`; an exact (ended) path beats a param or splat.

## `@routeParam` / `@searchParam`

Any element inside `<std-router>` can bind a path param or query param to a read-only, reactive field:

```ts
import { routeParam, searchParam } from '@std-ui/router';

@tag('user-page')
class UserPage extends UIElement {
  @routeParam('id') readonly userId!: string; // route `:id`; name defaults to the field name
  @searchParam('tab') readonly tab?: string;  // `?tab=...`; undefined when absent
}
```

Declare fields `readonly` so TypeScript rejects writes (a runtime check throws too). Plain string fields only (no `accessor`, needs `useDefineForClassFields`). Connecting throws without an ancestor `<std-router>`; assigning to the field throws.

## Leaving with unsaved changes

```ts
const off = router.beforeLeave(() => !dirty() || confirm('Discard changes?'), { unload: dirty });
// call off() on disconnect
```

`unload` also prompts on tab close / reload while the hook is registered.

## Browser support

Needs the Navigation API. `precommitHandler` is native in Chrome/Edge 146+ and Firefox 148+; elsewhere (e.g. Safari) a built-in shim emulates it.

## Demo

`npm run demo` from the repo root, then open `/router`. The whole demo app is routed by `<std-router>` (`demo/app/shell.ts`, real paths; the dev server falls back to `index.html`, the build also emits `404.html`).

## Tests

jsdom has no Navigation API: `import { createMemoryNavigation } from '@std-ui/router/testing'` and pass it as `navigation`.
