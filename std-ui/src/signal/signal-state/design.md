# Signal tree — internal design

How `signalState()` in [`main.ts`](./main.ts) is implemented. For usage and API, see [`README.md`](./README.md).

## Module layout

| File | Role |
| --- | --- |
| [`main.ts`](./main.ts) | `signalState`, `DeepPartial`, `SignalState`: dispatch to array / object / leaf |
| [`node.ts`](./node.ts) | `ItemNode` (child contract), `readValue` (plain-value read of any node), change tracking (`dirty` / `reset`) |
| [`check/`](./check/) | Validation: lazy `node.check` and its aggregates (see [`check/design.md`](./check/design.md)) |
| [`array/`](./array/) | `signalArray` (see [`array/design.md`](./array/design.md)) |
| [`object/`](./object/) | `signalObject` (see [`object/design.md`](./object/design.md)) |
| [`index.ts`](./index.ts) | Re-exports |
| [`tree.test.ts`](./tree.test.ts) | Behavior tests |

## Build algorithm

```ts
const child = (item) => signalState(item, signalOptions);
if (Array.isArray(value)) return signalArray(value, child);
if (isPlainObject(value)) return signalObject(value, child);
return signal(value, signalOptions);
```

`isPlainObject` requires `typeof object`, non-array, and prototype `Object.prototype` or `null`.
`null` is not an object node at runtime (despite TS `object` including `null` in `IsBranch`).

## One shape for containers

`signalArray` and `signalObject` are built the same way:

- one `Signal` of child nodes with `equals: () => false`, edited **in place** for structural
  changes (array mutators, object `delete`) and swapped for a **new instance** on replacement;
- `()` = `computed(() => children())` — the core's `Object.is` equality cutoff lets only a new
  instance through (see [`../core/computed-lazy.md`](../core/computed-lazy.md));
- `shallow()` = `children()` — every structural change;
- `deep()` = `computed` mapping each child through `readValue`;
- a `Proxy` for untracked child access (`list[i]`, `obj.key`).

`readValue(node)` calls `node.deep()` when present (containers) and `node()` otherwise (leaves), so
containers nest without knowing each other.

## Types vs runtime

| Concern | Runtime | Types (`IsBranch`, `DeepPartial`) |
| --- | --- | --- |
| Plain object | `SignalObject` | `SignalObject & Members<T>` |
| `null` / `undefined` at init | Leaf | Leaf |
| Interface-typed object | Object if plain at runtime | Object (looser than `isPlainObject`) |
| Array | `SignalArray` | `SignalArray` |
| Function, class instance | Leaf | Leaf (`Signal<T>`) |

Members added at runtime via `set()` are not reflected in the static type.

## Consumers

`createStore()` in [`../../decorators/field-store.ts`](../../decorators/field-store.ts) uses
`signalState()` for component field backing. Generic readers that need a plain value from any store
(`wire-reflect`, `wire-provide`, `bind`) use `readValue`.

## Notification sketch

```
leaf.set(v)              →  leaf notifies  →  ancestors' deep() dirty  →  effects on deep()
obj.set({ k: v })        →  only touched members notify (record unchanged)
obj.set({ newKey: v })   →  new record  →  (), shallow(), deep()
obj.delete(k)            →  in-place edit  →  shallow(), deep()
obj.set(undefined|null)  →  new record + empty flag  →  (), shallow(), deep()
```
