# Signal tree (`signalState`)

`main.ts` builds a reactive tree out of a value: plain objects become a
[`SignalObject`](./object/README.md), arrays a [`SignalArray`](./array/README.md), and everything
else a leaf `signal()`, recursively. Members are reachable as properties, so you navigate and
write the tree like the original object.

For implementation, see [`design.md`](./design.md).

```ts
import { signalState, effect } from '../index.js';

const a = signalState({ b: { c: { d: 1 } } });

effect(() => {
	console.log(a.deep()); // { b: { c: { d: 1 } } }
});

a.b.c.d.set(2); // d notifies -> c, b, a deep() dirty -> effect re-runs
```

## Three reads on every container

Objects and arrays share the same tracking depths. Every read returns the same plain value; only
what it re-runs on differs:

| Read | Re-runs on |
| --- | --- |
| `x()` | replacement only (like a plain `signal(value)`) |
| `x.shallow()` | + structural change (key add/delete, push/splice/reorder) |
| `x.deep()` | + any value change below, recursively |
| `x.peek()` | never (deep untracked snapshot) |

Leaves (`SignalLeaf`) are core `Signal`s with `shallow()` / `deep()` added, all three the same read.
Child nodes are reached through properties (`x.key`) and `list.at(i)` / `list[i]`. For signals that may come
from outside the tree (plain `signal()` / `computed()` / `toSignal()`, or future standard
signals), use [`readValue`](./node.ts).

## What counts as an object vs. a leaf

- A **`SignalObject`** is a plain object (`{ ... }` literal, or `Object.create(null)`).
- **Arrays** become a `SignalArray` (per-element nodes + tracked structure).
- Everything else — numbers, strings, booleans, `null`, `undefined`, class instances, functions — is
  a **leaf**, stored as-is in a `signal()`. Class instances are *not* walked; replace them with
  `.set(...)`.

## API

### `signalState(value, signalOptions?)`

Converts a value into its `SignalState`. Reach into leaves to read or write them:

```ts
a.b.c.d();      // 1 (tracked read)
a.b.c.d.set(5); // write the leaf
a.deep();       // { b: { c: { d: 5 } } } (tracked read)
a().b === a.b;  // true: `()` on a container returns its child nodes
```

`signalOptions` is forwarded to every leaf `signal()` (e.g. custom `equals`); it has no effect on
containers.

### `node.set(partial)`

**Objects:** patches in place — existing members get `.set(value)` (recursing), keys **omitted**
from `partial` are left unchanged, and **unknown keys become new members**. Each touched leaf
notifies independently, so sibling subtrees skip work. Remove a member with `obj.delete(key)`.

**Arrays:** replaces contents, reusing item nodes by index (see [`array/`](./array/README.md)).

**Leaves:** `partial` is the whole value, same as a plain `signal()`.

```ts
a.set({ b: { c: { d: 9 } } }); // only a.b.c.d changes
a.b.c.set({ d: 10 });          // scoped to the `c` object
a.b.c.set({ e: 1 });           // adds member `e`
a.b.c.delete('e');             // removes it
a.b.c.d.set(11);               // leaf: replace the whole value
```

### `undefined` and `null`

| Node | Write | Read after write |
| --- | --- | --- |
| **Leaf** | `leaf.set(undefined)` / `leaf.set(null)` | `undefined` / `null` |
| **Leaf** (via object partial) | `obj.set({ leaf: undefined })` | Same — value is forwarded to the member |
| **Object** (whole node) | `obj.set(undefined)` / `obj.set(null)` | `deep()` / `peek()` read as `undefined` / `null` until restored |
| **Object** (restore) | `obj.set({ ... })` with an object partial | Reassembled from members |

Clearing an object keeps its member nodes (`a.b.c.d` still works); writes to them are hidden from
the object's `deep()` until it is restored. At **init**, `null` and `undefined` are leaves — include
the key explicitly if you need a reactive slot that starts empty.

### `node.update(fn)`

Reads with `.peek()`, passes it to `fn`, and `.set()`s the result back.

```ts
a.b.c.d.update((prev) => prev + 1);
a.b.c.update((prev) => ({ d: prev.d + 1 }));
```

## Notes / gotchas

- Member access (`a.b`) is untracked; it returns the node. API names (`set`, `update`, `peek`,
  `deep`, `shallow`, `delete`) win over members of the same name.
- Object partial `.set()` assumes the value under an existing key matches that member's kind
  (object vs leaf); it does not convert a leaf into an object or vice versa.
