# `@querySlotted()` - internal design

Usage: [`README.md`](./README.md).

## Layout

| File | Owns |
|---|---|
| [`query-slotted.decorator.ts`](./query-slotted.decorator.ts) | `@querySlotted(options)` (field decorator), `querySlottedNodes()` (the single read implementation, also exported as the decorator-free `querySlottedNodes(host, options)`), `QuerySlottedOptions`. |
| [`dev/warn-missing-slot.ts`](./dev/warn-missing-slot.ts) | DEV-only warning when a shadow root has no matching `<slot>` (usually a name typo). Deduplicated per tag + slot name via core's `once`. |
| [`./slot-content.ts`](./slot-content.ts) | Light-DOM content store (`snapshotLightChildren`, `getSlotContent`) and the `slotSnapshotHooks` class hook. Shared with the `slot()` directive. |

## Read pipeline

`querySlottedNodes(host, options)` runs on every access:

1. **Source** (`assignedNodes`): depends on `host.renderRoot` (see below).
2. **`selector`**: keeps only `Element`s that `.matches(selector)`; text/comment nodes are dropped.
3. **`filter`**: custom predicate applied to what is left (it narrows the field's type via a type guard).

The array is rebuilt each time: there is no cache and no signal, so it never goes stale but is not reactive. Read it from `updated()`/event handlers, not from a `computed`/`effect` expecting re-runs.

## Shadow vs light DOM

- **Shadow DOM** (`host.renderRoot` is a `ShadowRoot`, i.e. `static shadowRootOptions` is set): finds `slot[name="..."]` (`slot:not([name])` for the default slot; the name goes through `CSS.escape`) and returns `<slot>.assignedNodes({ flatten })`. If the template renders no such `<slot>`, it returns `[]` and, in DEV, warns once. `flatten` only has meaning here.
- **Light DOM** (default): there is no native `<slot>`, so it reads the host's original children, grouped by their `slot` attribute (no attribute = default slot), from `getSlotContent(host, slot)`. This is the same store the [`slot()` directive](../../../../../ext/src/element/template/directives/slot/README.md) projects from, so the result is identical whether or not the template uses `slot()`, and it keeps returning the nodes after `slot()` has moved them into place. `flatten` is ignored.

## Snapshot timing

Light-DOM children share the host with the rendered output, so they must be recorded before the first render replaces or interleaves with them.

- The decorator registers `slotSnapshotHooks` with `addClassHooks(context.metadata, ...)` at decoration time. Class hooks are stored in the class's decorator metadata, inherited by subclasses and added once per class (`addClassHooks` is idempotent), so there is no per-instance object and core's `UIElement` needs no slot-specific code.
- `beforeConnect` runs before the first render and calls `snapshotLightChildren(host)`. It is skipped when the host already has a `shadowRoot`.
- `snapshotLightChildren` is idempotent and a no-op for a host with no children; the first snapshot wins, so reconnects never re-capture rendered output.
- `slot()` also calls `snapshotLightChildren` lazily on first use, which covers components that use the directive but have no `@querySlotted` field.

Consequence: children must exist when the element connects (script-created elements, or upgrades of already-parsed markup). Children added later are not in the snapshot; in DEV `getSlotContent` warns when it sees a child for a named slot that is missing from the snapshot (`dev/warn-slot.ts` in the slot folder).

## Design decisions

- **One implementation.** The decorator and `querySlottedNodes()` both delegate to `querySlottedNodes`, so options behave identically.
- **Plain fields only.** `accessor` and other kinds throw: the decorator installs its own getter with `Object.defineProperty` in an initializer, which an `accessor` would conflict with.
- **Per-instance getter, `enumerable` + `configurable`.** Nothing is stored on the prototype or in a registry, so instances are garbage-collected normally.
- **Lives in core.** It works in shadow DOM natively and owns the light-DOM content store; only the `slot()` projection directive is in ext, and it reads the same store through core's public exports.

## Tests

Light-DOM behaviour is covered with the `slot()` tests in [`../../../../../ext/src/element/template/directives/slot/slot.test.ts`](../../../../../ext/src/element/template/directives/slot/slot.test.ts).
