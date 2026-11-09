# Signal array — internal design

How `signalArray()` in [`core.ts`](./core.ts) is implemented. For usage, see [`README.md`](./README.md).

## Module layout

| File | Role |
| --- | --- |
| [`core.ts`](./core.ts) | `signalArray`, `SignalArray`, `ItemNode` |
| [`index.ts`](./index.ts) | Re-exports |
| [`signal-array.test.ts`](./signal-array.test.ts) | Behavior and granularity tests |

## Data model

Two layers:

1. **`nodes: Signal<N[]>`** — holds the ordered list of item **node references**. Mutations
   (`push`, `splice`, `set` trimming, etc.) copy-on-write via `mutate()`: `nodes.peek().slice()`,
   edit, then `nodes.set(list)`. Equality is always false so any structural write notifies even if
   every `N` instance was reused.
2. **Aggregate read** — `computed(() => nodes().map((n) => n()))` is the callable `SignalArray`.
   Reading it tracks `nodes` and every item's tracked read.

Item nodes are opaque except for `ItemNode<T>` (`()`, `.peek()`, `.set()`). `signalState` passes
`(item) => signalState(item)` so elements can be branches or leaves.

## `mutate(fn)`

Shared path for all structural edits:

```ts
const list = nodes.peek().slice();
const result = fn(list);
nodes.set(list);
return result;
```

`.peek()` on the node list avoids registering a dependency when only **return values** of mutators
(e.g. `pop()`'s removed value) are needed inside an effect that already read the collection.

## `set(values)` semantics

By index:

- `i < list.length` → `list[i].set(values[i])` (same node identity, new value).
- `i >= list.length` → `makeItem(values[i])` appended.
- After loop, `list.length = values.length` (drops trailing nodes).

This matches "replace array contents" while preserving per-index subscriptions. It differs from
assigning a new array into a plain `signal<T[]>`.

## `at(index)` and `length`

- `at` uses one cached `computed` per requested index that reads `nodes()` and indexes, so dependents
  only re-run when the node at that index changes (default `Object.is`), not on every structural edit.
- Negative indices (`length + index`) are deliberately not normalized to positive ones: `-1` follows
  the last slot as length changes, so it gets its own cache entry. Normalizing would need an untracked
  length (stale) or a tracked one (defeats the cache).
- `length` is `computed(() => nodes().length)` — does **not** read item values, only structure.

## Integration with `signalState`

In [`../core.ts`](../core.ts), `Array.isArray(value)` dispatches to:

```ts
signalArray(value, (item) => signalState(item, signalOptions));
```

`SignalState<T>` when `T` is an array type resolves to `SignalArray<U, SignalState<U> & ItemNode<U>>`.

Branch `.set({ key: array })` forwards the array to `child.set(array)` on a `SignalArray` child
(whole-value replace, not `DeepPartial` index patches).

Parent branch `computed` still reads `children[key]()` for array children, so any item or structure
change dirties the parent object snapshot.

## Notification sketch

```
item.set(v)     →  item notifies  →  aggregate computed dirty  →  parent branch computed (if any)
push/splice/... →  nodes signal notifies  →  aggregate + length computeds dirty
effect on at(i) →  depends on nodes + item i only (not sibling items' values)
effect on ()    →  depends on nodes + every item ()
```

## Type notes

- `ItemNode.set(value: any)` avoids coupling to `Signal` vs branch `DeepPartial` set signatures.
- Generic `N extends ItemNode<T>` allows `SignalState` element nodes with extra properties.
