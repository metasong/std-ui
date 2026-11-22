# `slot` - internal design

Light-DOM slot projection. Usage: [`README.md`](./README.md).

## Layout

| File | Owns |
|---|---|
| [`slot-content.ts`](./slot-content.ts) | `snapshotLightChildren(host)` and `getSlotContent(host, name)`; two `WeakMap`s keyed by host. |
| [`index.ts`](./index.ts) | `SlotDirective`, `SlotRenderer`, `export const slot = directive(SlotDirective)`. |
| [`slot.test.ts`](./slot.test.ts) | Named/default projection, fallback, re-render stability. |
| [`../../../ui-element.ts`](../../../ui-element.ts) | Calls `snapshotLightChildren(this)` in `#ensureRenderRoot` when the render root is the host. |
| [`../../../decorators/query/query-assigned.decorator.ts`](../../../decorators/query/query-assigned.decorator.ts) | Reads `getSlotContent` in light DOM. |

`ChildPart` has no knowledge of `slot`; the directive hands it a renderer via `renderWith()`, same pattern as
[`../cache/`](../cache/design.md).

## The problem

A light-DOM component renders into its own host, so a parent's children
(`<x-card><h1 slot="title">..</h1></x-card>`) share a container with rendered output, and nothing marks which
nodes are which. Native `<slot>` solves this with a shadow boundary; light DOM needs the original children recorded
before rendering mixes things up.

## Capture: snapshot, then group lazily

1. `UIElement.#ensureRenderRoot` runs once per connect, before the first `template()`. If the render root is the host
   it calls `snapshotLightChildren(host)`, which stores `Array.from(host.childNodes)` in `snapshots`.
   No DOM mutation, so components that never call `slot()` behave exactly as before (important: imperative
   components may rely on static markup staying in place).
2. `getSlotContent(host, name)` builds `grouped` (`Map<slotName, Node[]>`) on first call from the snapshot, keyed by the
   node's `slot` attribute (`''` for no attribute and for text/comment nodes), then caches it.
3. The snapshot is taken once (`snapshots.has(host)` guard), so reconnects and later renders never re-capture rendered
   output as if it were parent content.

The snapshot holds strong references to the nodes for the host's lifetime (WeakMap value), which is intended: the nodes
are moved around the host and must stay reachable even while a slot is disposed.

## Commit: move once, stay put

`SlotRenderer` (one per binding position):

- First `update()`: `getSlotContent(host, name)` then `anchor.before(node)` for each node. Moves them out of wherever
  they are (initially the host, or a previous position).
- Later `update()` with the same name: nothing to do for projected nodes (idempotent), so parent content is never
  re-created or diffed. A different name returns `false`, so `ChildPart` disposes and replaces the renderer.
- Fallback: when the slot has no nodes and a `fallback` template is given, a nested `TemplateRenderer` renders it
  before its own comment anchor (`#fallbackAnchor`), and diffs it on re-render like any template. If the template's
  `strings` change, it is replaced.
- `disconnect()` forwards to the fallback renderer only; projected nodes belong to the parent, which owns their
  lifecycle.
- `dispose()` removes the projected nodes from the DOM (they stay in `grouped`, so recreating the slot re-inserts them)
  and removes the fallback and its anchor.

## Why not a factory-level `<slot>` element

Building `<slot name="x">` in `factory.ts`/`builder.ts` would give nicer syntax but conflicts with native `<slot>` in
shadow-DOM components using the same template engine. A directive keeps the two cases explicit and needs no compiler-level support
change.

## Known limits

- Snapshot at connect: children appended later, or not yet parsed when the element upgrades, are not seen. A
  `MutationObserver` that routes later children to their slot is the natural extension; not implemented.
- No `slotchange` event.
- Using the same slot name at two positions moves the nodes to the later one (a node can only be in one place; native
  slots behave the same way - a slot name is assigned to the first matching `<slot>` only).
- Custom-element children are reparented when moved, so their `disconnectedCallback`/`connectedCallback` fire once
  during projection.
