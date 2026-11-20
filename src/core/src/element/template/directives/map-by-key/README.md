# `mapByKey` — keyed list child directive

Built-in **child directive**: renders an iterable as sibling DOM subtrees, reconciled by **key** so
reordering, updates, and removals reuse existing nodes instead of positional diffing.

```ts
import { t, mapByKey } from '@std-ui/core';

t`<ul>${mapByKey(todos, (todo) => todo.id, (todo) => t`<li>${todo.text}</li>`)}</ul>`;
```

## API

### `mapByKey(items, keyFn, template)`

- **`items`** — any `Iterable<T>` (array, generator, etc.).
- **`keyFn`** — `(item, index) => key`. Keys must be unique within one render; duplicates throw.
- **`template`** — `(item, index) => value` passed to the child renderer (string, nested `t`, another directive, …).

For positional lists (fixed order, append/shrink only), use `items.map(...)` instead — index keys
do not buy DOM reuse (see [`design.md`](./design.md)).

## Example — sortable list with stable rows

A keyed-repeat demo sorts todos and keeps each row’s checkbox with its item. The same idea in
std-ui: a `UIElement` with `@state()`, `mapByKey` keyed by `id`, and a sort that assigns a **new**
array (in-place `.sort()` does not notify `@state()`).

```ts
import { t, mapByKey, state, tag, UIElement } from '@std-ui/core';

type Chore = { id: string; label: string };

@tag('sortable-chores')
class SortableChores extends UIElement {
  @state() chores: Chore[] = [
    { id: 'wash', label: 'Wash dishes' },
    { id: 'mail', label: 'Check mail' },
    { id: 'walk', label: 'Walk the dog' },
    { id: 'read', label: 'Read a chapter' },
  ];

  protected override template() {
    return t`
      <p>Chore list — sort and the rows move; keyed rows keep their controls.</p>
      <button type="button" @click=${() => this.sortByLabel(1)}>A → Z</button>
      <button type="button" @click=${() => this.sortByLabel(-1)}>Z → A</button>
      <ul>
        ${mapByKey(
          this.chores.deep(),
          (c) => c.id,
          (c) => t`
            <li data-id=${c.id}>
              <label><input type="checkbox" /> ${c.id}) ${c.label}</label>
            </li>
          `,
        )}
      </ul>
    `;
  }

  private sortByLabel(dir: 1 | -1) {
    this.chores.set([...this.chores.deep()].sort((a, b) => a.label.localeCompare(b.label) * dir));
  }
}
```

With `${this.chores.deep().map(...)}` instead, the same sort would reorder labels but leave each checkbox
on its *index*, not its chore. **Run it:** browser demo — [`../../../../../demo/README.md`](../../../../../demo/README.md) (`npm run demo`, section **Keyed lists**).
Vitest walkthrough — [`../../../../../doc/map-by-key-sort.example.test.ts`](../../../../../doc/map-by-key-sort.example.test.ts) (`npm test -- map-by-key-sort.example`).

## When to use `mapByKey` vs a plain array

Binding `${items.map(...)}` or `${rows}` uses `ListRenderer`: index `i` always patches the *i*th
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

- [`design.md`](./design.md) — module layout, `MapByKeyRenderer`, `renderWith()` protocol.
- [`../directive.ts`](../directive.ts) — generic `Directive` / `directive()` protocol.
- [`../../tag-funcs/html/html.md`](../../tag-funcs/html/html.md#directives) — writing custom directives.
- [`map-by-key.test.ts`](./map-by-key.test.ts) / [`../directives.test.ts`](../directives.test.ts) — tests.
- [`../../../../../demo/README.md`](../../../../../demo/README.md) — interactive demo (`npm run demo`).
- [`../../../../../doc/map-by-key-sort.example.test.ts`](../../../../../doc/map-by-key-sort.example.test.ts) — sortable chore list (Vitest).
