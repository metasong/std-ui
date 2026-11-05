# Signal tree

`tree.ts` builds a reactive tree out of a plain-object value: every leaf becomes a `signal()`,
every nested object becomes a `computed()` that reassembles its children, and each child is
exposed as a same-named property so you can navigate/write the tree like the original object.

```ts
import { buildSignalTree, effect } from '../index.js';

const a = buildSignalTree({ b: { c: { d: 1 } } });

// Conceptual shape after build:
// a.b.c.d  — Signal<number>
// a.b.c    — Computed<{ d: number }>   → reads d()
// a.b      — Computed<{ c: {...} }>    → reads c()
// a        — Computed<{ b: {...} }>    → reads b()

effect(() => {
	console.log(a()); // { b: { c: { d: 1 } } }
});

a.b.c.d.set(2); // d notifies -> c dirty -> b dirty -> a dirty -> effect re-runs, logs { b: { c: { d: 2 } } }
```

## What counts as a branch vs. a leaf

- A **branch** is a plain object (`{ ... }` literal, or `Object.create(null)`), recursed into
  key by key.
- Everything else — numbers, strings, booleans, `null`, `undefined`, arrays, class instances,
  functions — is a **leaf**, stored as-is in a `signal()`. Arrays and class instances are *not*
  walked; replace them wholesale with `.set(...)`.

## API

### `buildSignalTree(value)`

Converts a value into its `SignalState`. Call the result (or any sub-node) like a function to read
it reactively (tracks as a dependency, like `computed()`/`signal()` reads). Reach into leaves to
write them directly:

```ts
a.b.c.d();      // 1 (tracked read)
a.b.c.d.set(5); // write the leaf
a();            // { b: { c: { d: 5 } } } (tracked read, recomputed lazily)
```

### `node.peek()`

Reads a node (or whole tree) back into a plain value **without** tracking it (or any descendant)
as a dependency — a deep untracked snapshot, recursing via `.peek()` on every child. Use this for
logging/debugging/one-off snapshots inside an effect or computed without adding any dependency.
This overrides `Computed`'s own shallow `.peek()` on branches, which would otherwise still track
children through their tracked `()` reads.

```ts
a.peek(); // { b: { c: { d: 5 } } }, untracked
```

### `node.set(partial)`

Writes a partial object into a node in place. On **branches**, only keys present in `partial` are
touched — each touched leaf calls `.set()` independently, so untouched branches don't
recompute/notify. Can be called on the whole tree or on any branch within it. On **leaves**,
`partial` is the whole value (`DeepPartial<T>` is just `T` for leaves), same as a plain `signal()`.

```ts
a.set({ b: { c: { d: 9 } } }); // only a.b.c.d changes; sibling branches untouched
a.b.c.set({ d: 10 });          // equivalent, scoped to the `c` branch
a.b.c.d.set(11);                // leaf: replace the whole value
```

`set` is typed as `DeepPartial<T>`, so any subset of nested keys is allowed.

### `node.update(fn)`

Reads the node with `.peek()`, passes it to `fn`, and `.set()`s the result back — works the same
way on branches and leaves. `fn` may return a partial value for branches, same rules as `.set()`.

```ts
a.b.c.d.update((prev) => prev + 1);          // leaf: increment
a.b.c.update((prev) => ({ d: prev.d + 1 })); // branch: partial update
```

## Notes / gotchas

- Tree shape is fixed at `buildSignalTree()` time — you can't add/remove keys later (it mirrors
  the object's *structure*, not its contents).
- Branch nodes are read-only as a whole (`Computed` reads); update them with `.set(partial)` or write
  individual leaves (`a.b.c.d.set(...)`).
- Branch `.set()`'s recursion assumes the partial object's shape matches the tree below each key you provide; it
  does not validate the input is a plain object before recursing.
