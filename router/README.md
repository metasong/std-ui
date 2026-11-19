# @std-ui/router

Client-side router for std-ui on the **Navigation API** (required; no History fallback). See [design.md](./design.md).

```html
<std-router>
  <std-route path="/" element="home-page"></std-route>
  <std-route path="/users/:id" element="user-page"></std-route>
  <std-route path="*"><template><h1>Not found</h1></template></std-route>
  <std-outlet></std-outlet>
</std-router>
```

```ts
import '@std-ui/router';
import { createRouter } from '@std-ui/router';

const router = createRouter({ routes: [{ path: 'users/:id', element: 'user-page' }] });
await router.start();
router.navigate('/users/3');
router.params(); // { id: '3' }
```

Tests (jsdom has no Navigation API): `import { createMemoryNavigation } from '@std-ui/router/testing'` and pass it as `navigation`.
