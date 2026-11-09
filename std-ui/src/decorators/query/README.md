# `@query()` / `@queryAll()` / `@queryAsync()` — querying rendered DOM from a field

Three read-only field decorators for `UIElement` (see `../../ui-element.ts`) subclasses, mirroring
`lit`'s decorators of the same names: each turns a field into a live `querySelector`/
`querySelectorAll` lookup against **`this.renderRoot`** — the host element for light-DOM components
(default), or `shadowRoot` when the subclass sets `static shadowRootOptions`.

- **`@query(selector, cache?)`** — resolves to `this.renderRoot.querySelector(selector)`, re-run on
  every read by default, or resolved once and cached if `cache: true`.
- **`@queryAll(selector)`** — resolves to `this.renderRoot.querySelectorAll(selector)`, always a
  fresh, live-at-read-time `NodeList`.
- **`@queryAsync(selector)`** — resolves to a `Promise` of `this.renderRoot.querySelector(selector)`
  that waits for `this.updateComplete` (see `../../ui-element.ts`) first, so it reflects DOM produced
  by a render/effect that's still pending at the time it's read.

```ts
import { tag, state, query, queryAll, queryAsync, UIElement } from '../../index.js';
import { t } from '../../template/index.js';

@tag('todo-list')
class TodoList extends UIElement {
	@state() items = ['Buy milk', 'Walk dog'];

	@query('.title') title!: HTMLElement | null; // re-queried every read
	@query('form', true) form!: HTMLFormElement | null; // resolved once, then cached
	@queryAll('li') rows!: NodeListOf<HTMLLIElement>;
	@queryAsync('.new-row') newRow!: Promise<HTMLElement | null>; // waits for a pending render

	protected override template() {
		return t`
			<h2 class="title">To-dos</h2>
			<form><input /></form>
			<ul>${this.items.map(item => t`<li>${item}</li>`)}</ul>
		`;
	}
}
```

For implementation details, see [`design.md`](./design.md).

## Light DOM vs shadow (`renderRoot`)

By default, `UIElement` renders `template()` into the custom element itself (light DOM). Set
**`static shadowRootOptions`** on the subclass to render into a shadow root instead:

```ts
@tag('encapsulated-chip')
class EncapsulatedChip extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	@query('button') btn!: HTMLButtonElement | null;

	protected override template() {
		return t`<button type="button">inside shadow</button>`;
	}
}
```

All three query decorators always search **`this.renderRoot`**, so the same `@query('button')`
field works in either mode without branching. Code that uses **`this.querySelector`** directly (for
example imperative patches in `firstRendered()`) must query **`this.renderRoot`** when the component
uses a shadow root — otherwise it will not see nodes created by `template()`.

Override **`createRenderRoot()`** on `UIElement` when you need custom `attachShadow` options beyond
what `shadowRootOptions` provides. The render root is created once, before `connect()` runs on first
connect.

See [`../../ui-element.ts`](../../ui-element.ts) (`shadowRootOptions`, `renderRoot`,
`createRenderRoot`) and the demo [`../../../demo/sections/shadow-section.ts`](../../../demo/sections/shadow-section.ts).

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
@query('.lazy') lazySync!: Promise<HTMLElement | null>;
```

### Why `@queryAsync()` exists

`UIElement` re-renders when signals change, but those re-runs are **microtask-batched** (see
`../../signal/core/effect.ts` — `scheduleFlush()` queues one microtask per burst of synchronous
writes). A `@state()` assignment (or any signal write) takes effect immediately in memory; the DOM
only catches up after that pending flush runs.

`@query()` always calls `renderRoot.querySelector` at read time against whatever DOM exists **right now**. That
is correct when markup is already stable, or when you read long after the render has applied. It
fails in the common pattern “flip a signal, then immediately need a node that only appears because
of that flip” — especially conditional branches in `template()`:

```ts
el.show = true;
el.lazySync; // @query('.lazy') — still null; template() has not re-run yet
```

`@queryAsync()` returns a `Promise` that waits for `this.updateComplete` on `../../ui-element.ts`
first — “every render/effect re-run that was already scheduled when I read this field has applied to
the DOM” — and only then runs `renderRoot.querySelector`:

```ts
el.show = true;
await el.lazy; // @queryAsync('.lazy') — sees `<em class="lazy">` after the pending render
```

| Situation | Use |
|---|---|
| Node is stable, or you read after the DOM has caught up | `@query()` / `@queryAll()` |
| You just wrote a signal and need a node that exists only after the next render | `@queryAsync()` + `await` |

Every read returns a *new* `Promise` (re-running the query once `updateComplete` resolves again) —
there's no caching option, since the whole point is to reflect whatever render is pending at read
time. How `updateComplete` aligns with the effect flush (two nested microtasks) is documented in
[`design.md`](./design.md#queryasync-and-uielementupdatecomplete).

## Related reading

- [`./design.md`](./design.md) — why these need no initializer, and why they're plain-field-only.
- [`../design.md`](../design.md) / [`../state/README.md`](../state/README.md) — `@state()`/`@attribute()` shared
  field mechanics, which this folder's `addInitializer` technique borrows.
- [`../../ui-element.ts`](../../ui-element.ts) — `UIElement.updateComplete`, which `@queryAsync()`
  waits on.
- [`./query.test.ts`](./query.test.ts) — behavior tests.
