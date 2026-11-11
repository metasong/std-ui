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

## Validation

Every node (leaf, object, array) can carry validators. Reads (`()`, `shallow()`, `deep()`) always
return the plain value; errors live on the node, not on the value.

| Member | Role |
| --- | --- |
| `node.check.validators` | `Signal<Validator<T>[]>`; `node.check.validators.set([...])`. A validator takes the node's raw value and returns an error, an array of errors, or nothing. |
| `node.check.errors()` | Tracked `{ kind, message }[]` from this node's **own** validators (`[]` when valid). |
| `node.check.valid()` | Tracked boolean: this node's **own** validators report no errors. |
| `node.check.allValid()` | Tracked boolean: this node and every descendant has no errors. Same as `allErrors().length === 0`, but cheaper and only notifies when the boolean flips. |
| `node.check.allErrors()` | Tracked `{ kind, message, path }[]` for the node and all descendants, leaf first (each subtree in key/index order, then the node's own errors). `path` is relative to this node (`[]` = itself). |

```ts
const required: Validator<string> = (v) => (v ? undefined : { kind: 'required', message: 'Required' });

const form = signalState({ user: { name: '' }, tags: ['a', ''] });
form.user.name.check.validators.set([required]);
form.check.validators.set([(v) => (v.tags.length ? undefined : { kind: 'empty', message: 'No tags' })]);

form.user.name();   // '' (plain value)
form.user.check.allValid();  // false (descendant `name` has an error)
form.check.allErrors();   // [{ kind: 'required', message: 'Required', path: ['user', 'name'] }]
```

A `Validator` takes only the node's value. To configure one (limits, message), write a factory that
closes over the config and returns the validator:

```ts
const range = (min: number, max: number, message = `Must be between ${min} and ${max}`): Validator<number> =>
	(value) => (value >= min && value <= max ? undefined : { kind: 'range', message });

const form = signalState({ age: 1 });
form.age.check.validators.set([range(2, 8, 'value must be between 2 and 8')]);

form.age.check.errors(); // [{ kind: 'range', message: 'value must be between 2 and 8' }]
form.age.set(5);
form.age.check.valid();  // true
```

Branch validators see the raw subtree value, so cross-field checks work while a child is invalid.
Plain signals mixed into a tree have no validation and count as valid.

## Change tracking: `dirty` and `reset()`

On every node under `node.changes`, next to `node.check`. Not part of the data: `deep()` never
contains them.

| Member | Role |
| --- | --- |
| `node.changes.dirty()` | Tracked boolean: the node's current value differs (deeply) from the value it was created with. Editing back to the original makes it clean again. |
| `node.changes.reset(next?)` | Writes the initial value back: edited values restored, members added since removed, deleted members re-created, a cleared object restored. Validators stay. With `next`, `next` first becomes the new initial value (pushed down to every child), so `reset(node.peek())` marks the current value as saved and a later `reset()` returns to it. Not an undo: it never steps back to the state before your last edit. |

```ts
const form = signalState({ user: { name: 'a' }, tags: ['x'] });
form.user.name.set('b');
form.changes.dirty();       // true
form.user.name.changes.reset();
form.changes.dirty();       // false
```

The initial value starts as the value at creation; change it with `reset(next)`. `touched` is not
implemented.

## Notes / gotchas

- Member access (`a.b`) is untracked; it returns the node. API names (`set`, `update`, `peek`,
  `deep`, `shallow`, `delete`, `check`, `changes`, `_`) win over members of
  the same name; reach a shadowed member with `a._.name` (see [`object/`](./object/README.md)).
- Object partial `.set()` assumes the value under an existing key matches that member's kind
  (object vs leaf); it does not convert a leaf into an object or vice versa.

