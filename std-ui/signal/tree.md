# Signal tree

`tree.ts` builds a reactive tree out of a plain-object value: every leaf becomes a `signal()`,
every nested object becomes a `computed()` that reassembles its children, and each child is
exposed as a same-named property so you can navigate/write the tree like the original object.

```ts
import { buildSignalTree, patch, peak, effect } from '../index.js';

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

Converts a value into its `SignalTree`. Call the result (or any sub-node) like a function to read
it reactively (tracks as a dependency, like `computed()`/`signal()` reads). Reach into leaves to
write them directly:

```ts
a.b.c.d();      // 1 (tracked read)
a.b.c.d.set(5); // write the leaf
a();            // { b: { c: { d: 5 } } } (tracked read, recomputed lazily)
```

### `peak(node)`

Reads a node (or whole tree) back into a plain value **without** tracking it as a dependency —
every leaf is read via `.peek()`. Use this for logging/debugging/one-off snapshots inside an
effect or computed without adding it as a dependency.

```ts
peak(a); // { b: { c: { d: 5 } } }, untracked
```

### `patch(tree, patch)`

Writes a partial object into the tree in place. Only keys present in `patch` are touched — each
touched leaf calls `.set()` independently, so untouched branches don't recompute/notify.

```ts
patch(a, { b: { c: { d: 9 } } }); // only a.b.c.d changes; sibling branches untouched
```

`patch` is typed as `DeepPartial<T>`, so any subset of nested keys is allowed.

## Notes / gotchas

- Tree shape is fixed at `buildSignalTree()` time — you can't add/remove keys later (it mirrors
  the object's *structure*, not its contents).
- Branch nodes are read-only (`Computed`); you can't call `.set()` on `a.b`, only on leaves
  (`a.b.c.d`) or via `patch`.
- `patch`'s recursion assumes the partial object's shape matches the tree below each key you provide; it
  does not validate the input is a plain object before recursing.
