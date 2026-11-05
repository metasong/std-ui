# `@query()` / `@queryAll()` / `@queryAsync()` — querying rendered DOM from a field

Three read-only field decorators for `UIElement` (see `../../ui-element.ts`) subclasses, mirroring
`lit`'s decorators of the same names: each turns a field into a live `querySelector`/
`querySelectorAll` lookup against the element itself (light DOM here - `UIElement` renders into
the element, not a shadow root, so there's no `renderRoot` indirection like `lit`'s version has).

- **`@query(selector, cache?)`** — resolves to `this.querySelector(selector)`, re-run on every
  read by default, or resolved once and cached if `cache: true`.
- **`@queryAll(selector)`** — resolves to `this.querySelectorAll(selector)`, always a fresh,
  live-at-read-time `NodeList`.
- **`@queryAsync(selector)`** — resolves to a `Promise` of `this.querySelector(selector)` that
  waits for `this.updateComplete` (see `../../ui-element.ts`) first, so it reflects DOM produced
  by a render/effect that's still pending at the time it's read.

```ts
import { tag, state, query, queryAll, queryAsync, UIElement } from '../../index.js';
import { html } from '../../template/index.js';

@tag('todo-list')
class TodoList extends UIElement {
	@state() items = ['Buy milk', 'Walk dog'];

	@query('.title') title!: HTMLElement | null; // re-queried every read
	@query('form', true) form!: HTMLFormElement | null; // resolved once, then cached
	@queryAll('li') rows!: NodeListOf<HTMLLIElement>;
	@queryAsync('.new-row') newRow!: Promise<HTMLElement | null>; // waits for a pending render

	protected override template() {
		return html`
			<h2 class="title">To-dos</h2>
			<form><input /></form>
			<ul>${this.items.map(item => html`<li>${item}</li>`)}</ul>
		`;
	}
}
```

For implementation details, see [`design.md`](./design.md).

## Requirements

- **Plain field only** - no `accessor` support (unlike `@state()`/`@attribute()`). There's no
  per-instance value to back; every read just runs a fresh DOM query (or returns a cache), so an
  `accessor`'s `get`/`set`/`init` triple would be pure overhead. `@${name}() can only decorate a
  plain class field` is thrown otherwise.
- **Give the field a type annotation, not an initializer**: `title!: HTMLElement | null;`, not
  `title: HTMLElement | null = null;` - any value you assign is overwritten the moment the
  decorator's accessor is installed anyway. This only works because `tsconfig.json` sets
  `useDefineForClassFields: true` - see [`design.md`](./design.md#why-no-initializer-is-needed) for
  why that matters.
- **Read-only**: there's no setter. Assigning to a `@query()`/`@queryAll()`/`@queryAsync()` field
  throws (per `Object.defineProperty`'s default `set` of "none", in strict mode).
- Works at any point after the field is constructed - `connect()`, `template()`, event handlers,
  from outside the element entirely (`el.title`) - it doesn't require the element to be connected;
  it just runs whatever `querySelector`/`querySelectorAll` would return right now.

## `@query(selector, cache)`

```ts
@query('#input') input!: HTMLInputElement | null;
@query('.title', true) title!: HTMLElement | null; // resolved once, then cached
```

- `null` if nothing currently matches `selector` - same as `querySelector` itself.
- Without `cache` (the default `false`), every read re-runs the query - safe for a node that may
  be replaced (e.g. by a conditional `template()` branch), at the cost of a query per read.
- With `cache: true`, the *first* read's result is kept forever - cheaper for a node that's known
  to never be replaced (e.g. a static piece of markup written once in `connect()`), but a stale
  reference if the matched node is later removed/replaced.

## `@queryAll(selector)`

```ts
@queryAll('li') rows!: NodeListOf<HTMLLIElement>;
```

Always a fresh `querySelectorAll(selector)` result - no caching option, matching `lit`'s
`@queryAll()`. A `NodeList` is already a cheap live-ish snapshot; re-querying is the only way to
see additions/removals after the one you first read.

## `@queryAsync(selector)`

```ts
@queryAsync('.lazy') lazy!: Promise<HTMLElement | null>;
```

Use this instead of `@query()` when the queried node only exists conditionally in `template()` and
you're reading the field *immediately* after writing a signal that flips that condition - `@query()`
would see the DOM from *before* the pending render catches up, since writes are microtask-batched
(see `../../signal/core/effect.ts`). `@queryAsync()` instead waits for `this.updateComplete`
(resolves once any pending render/effect re-run has actually applied to the DOM) before running the
query:

```ts
el.show = true;
await el.lazy; // sees the node `show`'s new value causes `template()` to render
```

Every read returns a *new* `Promise` (re-running the query once `updateComplete` resolves again) -
there's no caching option, since the whole point is to reflect whatever render is pending right now.

## Related reading

- [`./design.md`](./design.md) — why these need no initializer, and why they're plain-field-only.
- [`../design.md`](../design.md) / [`../README.md`](../README.md) — `@state()`/`@attribute()`'s own
  field mechanics, which this folder's `addInitializer` technique borrows.
- [`../../ui-element.ts`](../../ui-element.ts) — `UIElement.updateComplete`, which `@queryAsync()`
  waits on.
- [`./query.test.ts`](./query.test.ts) — behavior tests.
