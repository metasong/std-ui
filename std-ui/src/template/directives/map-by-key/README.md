# `mapByKey` — keyed list child directive

Built-in **child directive**: renders an iterable as sibling DOM subtrees, reconciled by **key** so
reordering, updates, and removals reuse existing nodes instead of positional diffing.

```ts
import { html, mapByKey } from 'std-ui';

html`<ul>${mapByKey(todos, (t) => t.id, (t) => html`<li>${t.text}</li>`)}</ul>`;
```

## API

### `mapByKey(items, keyFn, template)`

- **`items`** — any `Iterable<T>` (array, generator, etc.).
- **`keyFn`** — `(item, index) => key`. Keys must be unique within one render; duplicates throw.
- **`template`** — `(item, index) => value` passed to the child renderer (string, nested `html`, another directive, …).

For positional lists (fixed order, append/shrink only), use `items.map(...)` instead — index keys
do not buy DOM reuse (see [`design.md`](./design.md)).

## When to use `mapByKey` vs a plain array

Binding `${items.map(...)}` or `${rows}` uses `ListCommitter`: index `i` always patches the *i*th
child part. Inserting or reordering in the middle shifts which data sits at which index, so DOM and
state can end up on the wrong row.

Use **`mapByKey`** when:

- List order can change (drag-and-drop, sort).
- You need stable identity per row (focus, animation, form field state).
- Items are removed from the middle.

Use a **plain array** when the list only grows or shrinks at the end and order is fixed.

## Constraints

- Must be bound to a **child** interpolation (`${...}` in element content), not an attribute.
- Duplicate keys in one render throw: `std-ui mapByKey(): duplicate key …`.

## Related reading

- [`design.md`](./design.md) — module layout, `MapByKeyCommitter`, `commitWith()` protocol.
- [`../directive.ts`](../directive.ts) — generic `Directive` / `directive()` protocol.
- [`../html.md`](../html.md#directives) — writing custom directives.
- [`map-by-key.test.ts`](./map-by-key.test.ts) / [`../directives.test.ts`](../directives.test.ts) — tests.
