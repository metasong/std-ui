# Signal tree — internal design

How `stateTree()` in [`main.ts`](./main.ts) is implemented. For usage and API, see [`README.md`](./README.md).

## Module layout

| File | Role |
| --- | --- |
| [`main.ts`](./main.ts) | `state`, `DeepPartial`, `StateTree`: dispatch to array / object / leaf |
| [`node.ts`](./node.ts) | `ItemNode` (child contract), `readValue` (plain-value read of any node), change tracking (`dirty` / `reset`) |
| [`check/`](./check/) | Validation: lazy `node.check` and its aggregates (see [`check/design.md`](./check/design.md)) |
| [`array/`](./array/) | `stateArray` (see [`array/design.md`](./array/design.md)) |
| [`object/`](./object/) | `stateObject` (see [`object/design.md`](./object/design.md)) |
| [`index.ts`](./index.ts) | Re-exports |
| [`tree.test.ts`](./tree.test.ts) | Behavior tests |

## Build algorithm

```ts
const child = (item) => stateTree(item, signalOptions);
if (Array.isArray(value)) return stateArray(value, child);
if (isPlainObject(value)) return stateObject(value, child);
return state(value, signalOptions);
```

`isPlainObject` requires `typeof object`, non-array, and prototype `Object.prototype` or `null`.
`null` is not an object node at runtime (despite TS `object` including `null` in `IsBranch`).

## One shape for containers

`stateArray` and `stateObject` are built the same way:

- one `Signal` of child nodes with `equals: () => false`, edited **in place** for structural
  changes (array mutators, object `delete`) and swapped for a **new instance** on replacement;
- `()` = `computed(() => children.get())` — the core's `Object.is` equality cutoff lets only a new
  instance through (see [`../signal/computed-lazy.md`](../signal/computed-lazy.md));
- `shallow()` = `children.get()` — every structural change;
- `deep()` = `computed` mapping each child through `readValue`;
- a `Proxy` for untracked child access (`list[i]`, `obj.key`).

`readValue(node)` calls `node.deep()` when present (containers) and `node()` otherwise (leaves), so
containers nest without knowing each other.

## Types vs runtime

| Concern | Runtime | Types (`IsBranch`, `DeepPartial`) |
| --- | --- | --- |
| Plain object | `StateObject` | `StateObject & Members<T>` |
| `null` / `undefined` at init | Leaf | Leaf |
| Interface-typed object | Object if plain at runtime | Object (looser than `isPlainObject`) |
| Array | `StateArray` | `StateArray` |
| Function, class instance | Leaf | Leaf (`State<T>`) |

Members added at runtime via `set()` are not reflected in the static type.

## Consumers

`createStore()` in [`../../element/decorators/field-store.ts`](../../element/decorators/field-store.ts) uses
`stateTree()` for component field backing. Generic readers that need a plain value from any store
(`wire-reflect`, `wire-provide`, `bind`) use `readValue`.

## Notification sketch

```
leaf.set(v)              →  leaf notifies  →  ancestors' deep() dirty  →  effects on deep()
obj.set({ k: v })        →  only touched members notify (record unchanged)
obj.set({ newKey: v })   →  new record  →  (), shallow(), deep()
obj.delete(k)            →  in-place edit  →  shallow(), deep()
obj.set(undefined|null)  →  new record + empty flag  →  (), shallow(), deep()
```
