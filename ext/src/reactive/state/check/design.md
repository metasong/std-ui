# Validation layer (`check/`) — internal design

How `node.check` is built and aggregated. For usage see the validation section of
[`../README.md`](../README.md); for individual validators see [`validators/`](./validators/).

## Module layout

| File | Role |
| --- | --- |
| [`main.ts`](./main.ts) | Types (`Validator`, `Validation`, `Checked`, ...), `createValidation`, `attachCheck` |
| [`index.ts`](./index.ts) | Re-exports the above and all validators |
| [`validators/`](./validators/) | Built-in validators (see [`validators/design.md`](./validators/design.md)) |
| [`check.test.ts`](./check.test.ts) | Behavior tests, including the lazy-build cases |

The tree itself (`../node.ts`, `../leaf.ts`, `../object/`, `../array/`) only knows `check` through
`attachCheck`; `ItemNode` lists `check?` structurally, so the tree has no dependency on validation logic.

## Lazy build

`attachCheck(node, read, children?)` defines `node.check` as a getter. The validation members (the
`validators` signal and the computeds) are created on the first read and cached. A node nobody
validates costs nothing beyond a small record. Every container passes:

- `read`: the tracked plain value the validators see (`deep()` for containers, `()` for leaves);
- `children`: the node's current child entries `[key | index, node]`, tracked on structure.

## Aggregates look through unbuilt nodes

`allValid`, `allErrors` and `anyPending` must include descendants that have validators, but must not
force every descendant to build its `check`. A parent therefore does not read `child.check` directly;
it calls `view(child)` (in `main.ts`), which returns one of:

| Child state | What the parent does |
| --- | --- |
| `check` built | Uses the child's own `allValid()` / `allErrors()` / `anyPending()` (its subtree included) |
| `check` not built | The child cannot have validators, so it adds nothing itself. The parent descends into the child's own children, because a deeper node may have built its `check` |
| Not a tree node (custom `ItemNode`) | Falls back to `child.check` if present |

Consequences:

- Any descendant with validators is always counted, however many unbuilt nodes lie above it. Validators
  can only be set through `check`, so a node with validators is always a built node.
- A node that read `check` but set no validators is built with an empty list: valid, no errors.
- Async validators are only reachable through a built node, so their `pending` is always seen.
- Reading a parent's aggregate does not build its descendants. It still walks the unbuilt part of the
  subtree on each recompute (O(nodes)), but allocates nothing.
- Path prefixes for `allErrors` are added at each level, whether a level is built or not, so `path`
  is the same as with a fully built tree.

## Reacting to a late build

An aggregate that skipped an unbuilt node would otherwise never notice that node (or a descendant)
building its `check` later. A module-level signal, `builtVersion`, is bumped whenever any node builds
its `check`. `view()` reads it (tracked) whenever it looks at a tracked node, so every aggregate that
depended on "this node is unbuilt" re-evaluates when something is built.

Notes:

- The bump is a signal write that can happen while some effect or computed is running (the first
  `check` read can be inside one). The core skips the running node on self-writes, so this does not loop.
- Building is idempotent: only the first read writes `builtVersion`.
- The bump invalidates every aggregate that looked through an unbuilt node, not just the ones above the
  new node. That is cheap (the recompute is a walk) and keeps the mechanism free of parent links.

## What is not lazy

`changes` (`dirty` / `reset`) is still created eagerly by each node; see `createChangeTracking` in
[`../node.ts`](../node.ts).
