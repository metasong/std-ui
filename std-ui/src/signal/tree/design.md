# Signal tree — internal design

How `signalState()` in [`core.ts`](./core.ts) is implemented. For usage and API, see [`README.md`](./README.md).

## Module layout

| File | Role |
| --- | --- |
| [`core.ts`](./core.ts) | `signalState`, `DeepPartial`, `SignalState`, branch/leaf build and `.set()` / `.peek()` overrides |
| [`index.ts`](./index.ts) | Re-exports |
| [`tree.test.ts`](./tree.test.ts) | Behavior tests |

## Build algorithm

1. **Leaf path** — if `!isPlainObject(value)`, return `signal(value, signalOptions)` cast to
   `SignalState<T>`. One node; `DeepPartial<T>` = `T`.
2. **Branch path** — for each key in `Object.keys(value)`, recursively `signalState(child)`.
3. Attach children onto the branch via `Object.assign(node, children)` so `tree.b.c` property access
   works.
4. Branch node is a `computed()` that reads every child `()` and returns a fresh plain object snapshot.

`isPlainObject` requires `typeof object`, non-array, and prototype `Object.prototype` or `null`.
`null` is not a branch at runtime (despite TS `object` including `null` in `IsBranch`).

## Branch reads: `computed` + `cleared`

A branch has no stored “own” value when intact — its value is always derived from children.

When the user calls `branch.set(undefined)` or `branch.set(null)`, the implementation cannot delete
children (tree shape is fixed) and cannot call `Object.keys` on `null`/`undefined`. Instead each
branch owns a private **`cleared` signal**:

```ts
const cleared = signal<false | { value: undefined | null }>(false);
```

| `cleared` state | `branch()` / `branch.peek()` |
| --- | --- |
| `false` | Reassemble `{ [key]: child... }` from children |
| `{ value: undefined }` | `undefined` (children not read for assembly) |
| `{ value: null }` | `null` |

**Why a signal, not a closure variable:** the branch body is a `computed`. Only reads of signals
inside that computed register dependencies. Toggling `cleared` must dirty the branch (and ancestors /
effects) when the branch switches between empty and object-shaped reads.

**Restore:** `branch.set(partial)` with a non-nullish object sets `cleared` to `false`, then applies
the usual per-key `child.set(value)` loop. Omitted keys keep prior child values.

**Writes while cleared:** descendants remain full `SignalState` nodes. `.set()` on a child still
updates that child's signal; the branch computed does not read those children while `cleared` is
set, so parent reads stay empty until restore. Subscribers that read the child directly still
update.

**Repeated clear:** each `cleared.set({ value: ... })` allocates a new object; default signal
equality is referential, so clearing an already-cleared branch may notify again even when the
semantic value unchanged.

## Branch `.set(partial)` loop

1. If `partial === undefined || partial === null` → set `cleared` and return (whole-branch clear).
2. `cleared.set(false)`.
3. For each key in `Object.keys(partial)`:
   - Unknown key → throw (lists known keys).
   - `child.set(value)` — **no skip for `undefined`**; explicit `undefined` in a partial is
     forwarded to the child (leaf or branch).

For a **leaf** child, `undefined`/`null` is written into the leaf signal.

For a **branch** child, `child.set(undefined)` / `child.set(null)` hits step 1 on that branch
(clear sub-branch). An object partial recurses as nested patches.

## `.peek()` override

`Computed.peek()` would call children's tracked `()` reads and leak dependencies. Branch
`peek` checks `cleared.peek()` first, then recurses `children[key].peek()` for a deep untracked
snapshot.

## Types vs runtime

| Concern | Runtime | Types (`IsBranch`, `DeepPartial`) |
| --- | --- | --- |
| Plain object | Branch | Branch |
| `null` / `undefined` at init | Leaf | Leaf (`undefined` / non-object) |
| Interface-typed object | Branch if plain at runtime | Branch (looser than `isPlainObject`) |
| Array, function, class instance | Leaf | Leaf |

Types do not currently express “branch that may read as `undefined` | null`” after
`.set(undefined)`; branch nodes are still typed as `T` from the initial shape.

## Consumers

`createStore()` in [`../../decorators/field-store.ts`](../../decorators/field-store.ts) uses
`signalState()` for component field backing; `@state()` / `@attribute()` Object fields share this
path. See decorator README/design docs for wiring only — tree semantics live here.

## Notification sketch

```
leaf.set(v)  →  leaf signal notifies  →  parent computed dirty  →  …  →  root  →  effects
branch.set(clear)  →  cleared signal notifies  →  branch computed returns empty  →  same upward chain
branch.set({ k: ... })  →  touched leaves/computed notify  →  partial upward dirtying
```

Sibling branches are unaffected when a partial update only touches one subtree (each leaf notifies
independently; untouched branches' computeds may not re-run if their children's values are unchanged
and equality allows).
