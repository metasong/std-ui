# Signal tree (`signalState`)

`core.ts` builds a reactive tree out of a plain-object value: every leaf becomes a `signal()`,
every nested object becomes a `computed()` that reassembles its children, and each child is
exposed as a same-named property so you can navigate/write the tree like the original object.

For implementation (branch `cleared` flag, types, notifications), see [`design.md`](./design.md).

```ts
import { signalState, effect } from '../index.js';

const a = signalState({ b: { c: { d: 1 } } });

effect(() => {
	console.log(a()); // { b: { c: { d: 1 } } }
});

a.b.c.d.set(2); // d notifies -> c dirty -> b dirty -> a dirty -> effect re-runs
```

## What counts as a branch vs. a leaf

- A **branch** is a plain object (`{ ... }` literal, or `Object.create(null)`), recursed into
  key by key.
- Everything else — numbers, strings, booleans, `null`, `undefined`, arrays, class instances,
  functions — is a **leaf**, stored as-is in a `signal()`. Arrays and class instances are *not*
  walked; replace them wholesale with `.set(...)`.

## API

### `signalState(value, signalOptions?)`

Converts a value into its `SignalState`. Call the result (or any sub-node) like a function to read
it reactively (tracks as a dependency, like `computed()`/`signal()` reads). Reach into leaves to
write them directly:

```ts
a.b.c.d();      // 1 (tracked read)
a.b.c.d.set(5); // write the leaf
a();            // { b: { c: { d: 5 } } } (tracked read, recomputed lazily)
```

`signalOptions` is forwarded to every leaf `signal()` (e.g. custom `equals`); branches are always
`computed()`.

### `node.peek()`

Reads a node (or whole tree) back into a plain value **without** tracking it (or any descendant)
as a dependency — a deep untracked snapshot, recursing via `.peek()` on every child. Use this for
logging/debugging/one-off snapshots inside an effect or computed without adding any dependency.
On branches this overrides `Computed`'s shallow `.peek()`, which would still track children through
their tracked `()` reads.

```ts
a.peek(); // { b: { c: { d: 5 } } }, untracked
```

### `node.set(partial)`

Writes into a node in place.

**Branches:** only keys present in `partial` are touched; keys **omitted** from `partial` are left
unchanged. Each touched leaf notifies independently, so sibling branches often skip work.
`partial` must be a plain object (use the root/branch `.set(undefined)` / `.set(null)` cases below
to clear the whole branch).

**Leaves:** `partial` is the whole value (`DeepPartial<T>` is just `T`), same as a plain `signal()`.

```ts
a.set({ b: { c: { d: 9 } } }); // only a.b.c.d changes
a.b.c.set({ d: 10 });          // scoped to the `c` branch
a.b.c.d.set(11);                // leaf: replace the whole value
```

`set` is typed as `DeepPartial<T>`, so any subset of nested keys is allowed.

If `partial` includes a key that was **not** present on the initial value at `signalState()` time,
branch `.set()` throws an `Error` naming the unknown key and listing the keys that exist on that
node.

### `undefined` and `null`

| Node | Write | Read after write |
| --- | --- | --- |
| **Leaf** | `leaf.set(undefined)` or `leaf.set(null)` | `undefined` / `null` |
| **Leaf** (via branch partial) | `branch.set({ leaf: undefined })` | Same — value is forwarded to the child |
| **Branch** (whole node) | `branch.set(undefined)` or `branch.set(null)` | Whole branch reads as `undefined` / `null` until restored |
| **Branch** (restore) | `branch.set({ ... })` with an object partial | Object reassembled from children; **cleared** state is cleared |

Notes:

- Clearing a **branch** does not destroy its child nodes — references like `a.b.c.d` still work, and
  children's values are preserved while the branch reads empty. Call `.set({ ... })` on that branch
  again to expose them through the branch read again.
- While a branch is cleared, you can still `.set()` on descendants; those writes are stored but
  hidden from `branch()` / `branch.peek()` until the branch is restored.
- `undefined` and `null` on a **cleared branch** are distinct: `b.set(undefined)` vs `b.set(null)`
  yield different reads.
- At **init**, `null` and `undefined` are **leaves**, not branches. Include the key explicitly if
  you need a reactive slot that starts empty:

```ts
const state = signalState({ count: 0, note: undefined as string | undefined });
state.note.set('hi');
state(); // { count: 0, note: 'hi' }
```

A branch initially built as a nested object cannot be turned into a different runtime shape (e.g.
replacing an object branch with a number) without replacing the whole tree — tree shape is fixed at
`signalState()` time.

### `node.update(fn)`

Reads the node with `.peek()`, passes it to `fn`, and `.set()`s the result back — works the same
way on branches and leaves. `fn` may return a partial value for branches, same rules as `.set()`.

```ts
a.b.c.d.update((prev) => prev + 1);          // leaf: increment
a.b.c.update((prev) => ({ d: prev.d + 1 })); // branch: partial update
```

Returning `undefined` or `null` from `fn` on a **branch** clears the branch (same as `.set(undefined)`
/ `.set(null)`).

## Fixed tree shape

The tree is built once from `Object.keys` on the initial value. Only those keys get child
`SignalState` nodes; you cannot add or remove keys later via `.set()`.

| Initial snapshot | Result |
| --- | --- |
| `{ count: 0 }` | Only `count` exists on the tree |
| `{ count: 0, note: undefined }` | `count` and `note`; `note()` is `undefined` (a real leaf) |
| `{ count: 0 }` with a TS-optional `note?` that was never put on the object | No `note` node — optional types don't create keys at runtime |

A non-object root (`signalState(undefined)`, `signalState(42)`, etc.) is a single leaf tree with
no child properties.

## Notes / gotchas

- Tree shape is fixed at `signalState()` time — see **Fixed tree shape** above and the unknown-key
  error from branch `.set()`.
- Branch nodes are read-only as a whole (`Computed` reads); update them with `.set(partial)` or write
  individual leaves (`a.b.c.d.set(...)`).
- Branch partial `.set()` assumes the value under each key matches the child kind (branch vs leaf);
  it does not validate that nested values are plain objects before recursing.
