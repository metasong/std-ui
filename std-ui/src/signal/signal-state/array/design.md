# Signal array — internal design

How `signalArray()` in [`main.ts`](./main.ts) is implemented. For usage, see [`README.md`](./README.md).

## Module layout

| File | Role |
| --- | --- |
| [`main.ts`](./main.ts) | `signalArray`, `SignalArray` (`ItemNode` / `readValue` live in [`../node.ts`](../node.ts)) |
| [`index.ts`](./index.ts) | Re-exports |
| [`array.test.ts`](./array.test.ts) | Behavior and granularity tests |

## Data model

One signal plus derived reads:

1. **`nodes: Signal<N[]>`** — holds the ordered list of item **node references**. Structural
   mutators (`push`, `splice`, ...) edit this array **in place** via `mutate()` and then
   `nodes.set(sameArray)`; equality is always false so this still notifies. Only `set()` swaps in
   a **new** array.
2. **`()`** — `computed(() => nodes())` is the callable `SignalArray`. In-place edits recompute to
   the same instance, so the core's equality cutoff (see
   [`../../core/computed-lazy.md`](../../core/computed-lazy.md)) stops them; only `set()` gets through.
3. **`shallow()`** — reads `nodes()` directly: every structural change.
4. **`deep()`** — `computed(() => nodes().map(readValue))`: structure plus every item, recursively.

Item nodes are opaque except for `ItemNode<T>` (`()`, `.peek()`, `.set()`). `state` passes
`(item) => state(item)` so elements can be branches or leaves.

`[i]` is a `Proxy` `get` trap returning `nodes.peek()[i]` (untracked).

## `readValue(node)`

Reads a node's plain value, tracked: `node.deep()` if present (nested `SignalArray`), else `node()`.
Used by `deep()`, by object branches in [`../main.ts`](../main.ts), and by attribute reflection, since
a `SignalArray`'s `()` yields nodes, not values.

## `mutate(fn)`

Shared path for all structural edits:

```ts
const list = nodes.peek();
const result = fn(list);
nodes.set(list);
return result;
```

`.peek()` on the node list avoids registering a dependency when only **return values** of mutators
(e.g. `pop()`'s removed value) are needed inside an effect that already read the collection.

## `set(values)` semantics

Builds a new node array by index:

- `i < prev.length` → `prev[i].set(values[i])` and reuse `prev[i]` (same node identity, new value).
- `i >= prev.length` → `makeItem(values[i])`.
- Trailing old nodes are dropped.

This matches "replace array contents" while preserving per-index subscriptions, and the new array
instance is what notifies `()`.

## `at(index)` and `length`

- `at` uses one cached `computed` per requested index that reads `nodes()` and indexes, so dependents
  only re-run when the node at that index changes (default `Object.is`), not on every structural edit.
- Negative indices (`length + index`) are deliberately not normalized to positive ones: `-1` follows
  the last slot as length changes, so it gets its own cache entry. Normalizing would need an untracked
  length (stale) or a tracked one (defeats the cache).
- `length` is `computed(() => nodes().length)` — does **not** read item values, only structure.

## Integration with `state`

In [`../main.ts`](../main.ts), `Array.isArray(value)` dispatches to:

```ts
signalArray(value, (item) => state(item, signalOptions));
```

`SignalState<T>` when `T` is an array type resolves to `SignalArray<U, SignalState<U> & ItemNode<U>>`.

Branch `.set({ key: array })` forwards the array to `child.set(array)` on a `SignalArray` child
(whole-value replace, not `DeepPartial` index patches).

Parent branch `computed` reads `readValue(children[key])`, i.e. `deep()` for array children, so any
item or structure change dirties the parent object snapshot.

## Notification sketch

```
item.set(v)     →  item notifies  →  deep() dirty  →  parent branch computed (if any)
push/splice/... →  nodes notifies →  shallow(), deep(), length, at(i) dirty; () cut off (same instance)
set(values)     →  new nodes array →  all of the above, including ()
effect on at(i) →  depends on nodes + item i only (not sibling items' values)
```

## Type notes

- `ItemNode.set(value: any)` avoids coupling to `Signal` vs branch `DeepPartial` set signatures.
- Generic `N extends ItemNode<T>` allows `SignalState` element nodes with extra properties.
