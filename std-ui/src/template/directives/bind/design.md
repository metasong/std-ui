# `bind()` — internal design

Two-way property binding via a **property directive**. Usage and API: [`README.md`](./README.md).

## Mental model

A binding connects a **model** (a signal or `{ get, set }`) to one **property of one element**, in two directions:

| Direction | Trigger | Step | Skipped when |
|-----------|---------|------|--------------|
| model → view | every render | `syncToView()`: `write(el, prop, model)` | `equals(model, read(el, prop))` |
| view → model | the binding's DOM `event` | `syncToModel()`: `set(coerce(read(el, prop)))` | `equals(model, read(el, prop))` |

Everything else is defaulting: given `(element, property)`, which `event`, `equals`, `read`, `write` apply.

## Files

| File | Owns |
|------|------|
| [`types.ts`](./types.ts) | Public types (`BindOptions`, `BindSource`, `WritableSignal`) and the internal `Binding`. |
| [`defaults.ts`](./defaults.ts) | Element-aware defaults: event, equals, coerce, `.checked` target validation. Pure functions. |
| [`resolve.ts`](./resolve.ts) | `bind()` arguments → one `Binding` (`options ?? default`). |
| [`radio-group.ts`](./radio-group.ts) | Keeps same-named radio bindings consistent. |
| [`core.ts`](./core.ts) | `BindDirective` (DOM wiring + lifecycle) and the `bind()` function. |
| [`index.ts`](./index.ts) | Public exports. |
| [`bind.test.ts`](./bind.test.ts) | Tests through `t()` / `render()`. |

Related: [`../../parts/core.ts`](../../parts/core.ts) (`PropertyPart` directive dispatch), [`../../directive.ts`](../../directive.ts) (`PropertyPartInfo`).

## Why a property directive

Both directions need the **same element**: imperative property writes on render, and one stable event listener. Only `PropertyPart` is a single binding site on the element (`AttributePart`/`EventPart` are separate), so `bind()` is a `Directive` whose `update()` does its own work and returns `noChange` (same imperative style as `classMap`).

## Lifecycle

- **Every render** (`update()`): re-resolve the `Binding` (so `get`/`set`/hooks are never stale), make sure the listener is wired, then `syncToView()`.
- **Wiring** (`Wiring`: element + event + listener) is rebuilt only if the element or event name changes.
- **`disconnected()`** (template removed or position reused by something else): remove the listener, drop the binding. The part drops the instance, so a later render builds a fresh one.

## Live semantics

Default `equals`:

- Native checkbox/radio `.checked` → boolean compare.
- Native `.value` on `<input>` / `<textarea>` / `<select>` → string compare.
- Everything else → `Object.is`.

This is Lit's `live` on the **down** path; the **up** path is driven by the event.

## Defaults by element

| Concern | Rule |
|---------|------|
| Event | explicit `event` → native (`input`, or `change` for `<select>` / checkbox / radio) → `${kebab-property}-change` |
| Coercion | a numeric model bound to a native `.value` control stays numeric; otherwise identity |
| Validation | `.checked` on a non-checkbox/radio `<input>` throws in the constructor |

Custom conversions go through `read` / `write` (both directions), not a separate option.

## Special cases

- **Radio groups**: selecting a radio unchecks its siblings without events. Each bound radio registers a pull callback (`radio-group.ts`); the changed radio asks same-named siblings to `syncToModel()`, so their models become `false`.
- **`<select>`**: `.value` only applies once its `<option>`s exist, possibly after this part runs, so `update()` schedules one extra `syncToView()` in a microtask.

## `PropertyPart` integration

On each `update(values)`: a `DirectiveResult` goes through `applyDirective` (a `noChange` return stops further work); any other value `disconnect()`s the previous directive and falls back to plain `el[prop] = value`. `disconnectRendered()` / `unmount()` call `PropertyPart.disconnect()` → `BindDirective.disconnected()`.

## Manual `.value` + `@event` vs `bind()`

| Concern | Manual | `bind()` |
|---------|--------|----------|
| Listener identity | `EventPart` may replace the listener when the handler changes | one internal listener |
| Property write | every time the bound value changes | skipped when `equals(model, view)` |
| Boilerplate | two bindings | one |

## Related reading

- [`README.md`](./README.md) — public API and event table.
- [`../README.md`](../README.md) — index of built-in directives.
- [`../class-map/design.md`](../class-map/design.md) / [`../style-map/design.md`](../style-map/design.md) — attribute directive pattern.
- [`../../html.md`](../../html.md#directives) — binding kinds and extension points.
