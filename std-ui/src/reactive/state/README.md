# Signal tree (`state`)

`main.ts` builds a reactive tree out of a value: plain objects become a
[`SignalObject`](./object/README.md), arrays a [`SignalArray`](./array/README.md), and everything
else a leaf `signal()`, recursively. Members are reachable as properties, so you navigate and
write the tree like the original object.

For implementation, see [`design.md`](./design.md).

```ts
import { state, effect } from '../index.js';

const a = state({ b: { c: { d: 1 } } });

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

### `state(value, options?)`

Converts a value into its `SignalState`. Reach into leaves to read or write them:

```ts
a.b.c.d();      // 1 (tracked read)
a.b.c.d.set(5); // write the leaf
a.deep();       // { b: { c: { d: 5 } } } (tracked read)
a().b === a.b;  // true: `()` on a container returns its child nodes
```

`options` is forwarded to every leaf `signal()` (e.g. custom `equals`); it has no effect on
containers. `options.depth` controls how deep the tree is built:

| `depth` | Result | Notifies when |
|---|---|---|
| `'deep'` (default) | Every nested object / array is a node | any leaf changes (`deep()`), or structure (`shallow()`) |
| `'shallow'` | Root is a `SignalObject` / `SignalArray`; each member is a **leaf** holding its value as-is | a member is replaced, or a member is added / removed |
| `'value'` | The whole value is **one leaf** `Signal`, whatever its shape | the value is replaced |

```ts
const data = { id: 1, user: { name: 'Ada', tags: ['a'] } };

const deep = state(data);                         // default
deep.user.name.set('Bob');                              // notifies readers of user.name

const shallow = state(data, { depth: 'shallow' });
shallow.user();                                         // data.user (raw reference, not walked)
shallow.user.set({ name: 'Bob', tags: [] });            // replace the member: notifies
shallow.user().name = 'Zed';                            // in-place mutation: no signal
shallow.set({ id: 2 });                                 // patches members, like any container
shallow.deep();                                         // { id: 2, user: ... }

const value = state(data, { depth: 'value' });    // a plain Signal<typeof data>
value.set({ ...data, id: 2 });                          // only replacement notifies
```

Use `'shallow'` / `'value'` for large or opaque data you replace wholesale (rows from a server, a
parsed document) and don't want a node per field. Notes:

- A shallow or value tree does not walk its members, so **circular references inside a raw value
  are not rejected** (deep trees still reject them), and calling `changes.dirty` on such a value
  would recurse forever when comparing it.
- Reads collapse with the depth. On a **`'value'`** tree, `()`, `shallow()` and `deep()` are the
  same read, `valid` / `errors` / `pending` equal their `all*` aggregates (a leaf has no children),
  and `changes.dirty` is the single deep comparison of the value. On a **`'shallow'`** tree
  `deep()` is `shallow()`: both track structure (keys / items added or removed) and replacement
  of a member. A raw object / array member is not walked: mutating it in place does not notify.
  An **adopted deep node** is the exception: it is still a deep node, so writes inside it notify
  the shallow parent through its own `deep()`. `()` tracks only replacement of the member record.
- Depth is fixed at build time and applies to members created later too (`set()` with a new key,
  `push()`): in a shallow tree they are leaves.
- Depth composes: an existing node passed as a member is adopted with the depth it was built
  with, so a deep parent can hold shallow children:

  ```ts
  const big = state({ rows: [...] }, { depth: 'shallow' });
  const page = state({ title: 'T', big });  // deep parent, `big` stays shallow
  page.big.rows();                                // raw array (one leaf)
  page.deep();                                    // includes big's rows
  ```
- Types follow the depth: `SignalStateOf<T, D>` (members of a shallow tree are `SignalLeaf`s;
  `'value'` gives `SignalLeaf<T>`). Shallow `set()` takes `Partial<T>`.

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
| `node.check.errors()` | Tracked `{ flag, message }[]` from this node's **own** validators (`[]` when valid). |
| `node.check.valid()` | Tracked boolean: this node's **own** validators report no errors. |
| `node.check.allValid()` | Tracked boolean: this node and every descendant has no errors. Same as `allErrors().length === 0`, but cheaper and only notifies when the boolean flips. |
| `node.check.allErrors()` | Tracked `{ flag, message, path }[]` for the node and all descendants, leaf first (each subtree in key/index order, then the node's own errors). `path` is relative to this node (`[]` = itself). |

```ts
const required: Validator<string> = (v) => (v ? undefined : { flag: 'valueMissing', message: 'Required' });

const form = state({ user: { name: '' }, tags: ['a', ''] });
form.user.name.check.validators.set([required]);
form.check.validators.set([(v) => (v.tags.length ? undefined : { flag: 'valueMissing', message: 'No tags' })]);

form.user.name();   // '' (plain value)
form.user.check.allValid();  // false (descendant `name` has an error)
form.check.allErrors();   // [{ flag: 'valueMissing', message: 'Required', path: ['user', 'name'] }]
```

A `Validator` takes only the node's value. To configure one (limits, message), write a factory that
closes over the config and returns the validator:

```ts
const range = (min: number, max: number, message = `Must be between ${min} and ${max}`): Validator<number> =>
	(value) => (value >= min && value <= max ? undefined : { flag: 'customError', message });

const form = state({ age: 1 });
form.age.check.validators.set([range(2, 8, 'value must be between 2 and 8')]);

form.age.check.errors(); // [{ flag: 'customError', message: 'value must be between 2 and 8' }]
form.age.set(5);
form.age.check.valid();  // true
```

Branch validators see the raw subtree value, so cross-field checks work while a child is invalid.
Plain signals mixed into a tree have no validation and count as valid.

## Change tracking: `dirty` and `reset()`

Provided by `std-ui-ext` (`import { changes } from 'std-ui-ext'`), applied with `state(...).with(changes)`.
On every node under `node.changes`, next to `node.check`. Not part of the data: `deep()` never
contains them.

| Member | Role |
| --- | --- |
| `node.changes.dirty()` | Tracked boolean: the node's current value differs (deeply) from the value it was created with. On a leaf, an explicit `equals` option replaces the deep comparison (e.g. `Object.is` or an id compare for large 'value' data); containers always compare deeply. Editing back to the original makes it clean again. |
| `node.changes.initial()` | Tracked plain value `reset()` restores: the creation value, or the last `next` passed to `reset(next)`. |
| `node.changes.reset(next?)` | Writes the initial value back: edited values restored, members added since removed, deleted members re-created, a cleared object restored. Validators stay. With `next`, `next` first becomes the new initial value (pushed down to every child), so `reset(node.peek())` marks the current value as saved and a later `reset()` returns to it. Not an undo: it never steps back to the state before your last edit. |

```ts
const form = state({ user: { name: 'a' }, tags: ['x'] });
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
- **Existing nodes are adopted (composition).** A member that is already a tree node, e.g.
  `state({ a: state({ x: 1 }) })`, is used as-is: the parent's `deep()`, `check` and
  `changes` include it, so you can build a tree from independently owned nodes. The node is
  **shared, not copied**; writes through either owner affect both, and it can sit under several
  parents (a node under two keys reports its validation errors under both paths). Plain core
  signals (`signal()`, `computed()`) are not nodes and stay leaf values.
- **A node is plain data to its parent.** Adoption only happens when a member is *built*:
  at construction, or for a new key / item. From the parent's view, `address` in
  `state({ address: addr })` has the type `{ city: string }` (`Plain<T>`), so `set()` takes
  plain data and cannot swap in another node. `user.set({ address: { city: 'Rome' } })` writes
  into the adopted node (and so into everything sharing it); `user.changes.reset()` writes the
  initial plain value back into it the same way. To change which node is used, build a new tree.
- **Cycles through nodes are rejected.** A new key / item that is, or contains, its prospective
  parent (e.g. a node holding the parent) throws a `TypeError`.
- **A node can't be written into an existing member.** `set()` on an existing key (object) or
  index (array) with a node throws a `TypeError` instead of storing it. Without the guard a leaf
  would keep the node *function* as its value (not reactive, dropped by `JSON.stringify`), and
  an object member would read the node's method names (`deep`, `peek`, ...) as keys. The check
  runs before anything is written, so a rejected `set()` leaves the tree unchanged.

  ```ts
  const c = state<Record<string, unknown>>({ link: undefined });
  const d = state({ x: 1 });
  c.set({ link: d });  // TypeError: `link` already exists; use a new key to adopt `d`
  c.set({ other: d }); // OK: new key, `d` is adopted (c.other === d)
  ```
- **Circular references are rejected.** `state()` (and `set()` with a new key) throws a
  `TypeError` if an object/array contains itself, e.g. `b.parent === a` where `a.b === b`. Why:
  the tree is finite plain data, so a back-reference can't be a node (infinite tree), and
  treating it as a leaf would hold a raw, non-reactive copy that goes stale and makes
  `deep()` / `check` / `changes` skip everything behind it. Store an id instead, or keep the
  back-reference outside the state. Shared non-circular references are fine; each occurrence
  becomes its own independent node (identity is not preserved).

