# `UIFeat` - internal design

Usage: [`README.md`](./README.md).

## Layout

| File | Owns |
|---|---|
| [`ui-feat.ts`](./ui-feat.ts) | `UIFeat`: hook registration, per-phase cleanup merging, `effect()`, `attachTo()`. |
| [`ui-feat.test.ts`](./ui-feat.test.ts) | Lifecycle order, cleanup, reconnect, effects, late attach, `attachTo`, `disconnected()`. |
| [`../ui-element-hooks.ts`](../ui-element-hooks.ts) | `UIElementHooks`, `HookPhase`, class-level registry (`addClassHooks`). |
| [`../ui-element.ts`](../ui-element.ts) | `addHooks()` (instance hooks, late catch-up) and the phase runners. |

`UIElement` knows nothing about `UIFeat`: a feature is only a client of the public hook API.

## Why hooks, not a base class or mixin

| Option | Rejected because |
|---|---|
| Mixins (`WithDrag(UIElement)`) | Typing, name collisions and ordering get worse with every mixin; one chain per class. |
| Host-side `addController` (Lit) | A second registry beside `addHooks`, which already delivers the same phases. |
| Wrapper elements | Heavier DOM, different tool. |
| **Object + `addHooks`** | Zero host changes, per-instance state, typed host, composes by construction. |

Class-level hooks (`addClassHooks`) are for stateless extensions such as decorators. Features keep per-instance
state, so they use **instance hooks** and `attachTo` bridges the two.

## Cleanup model

The host already collects every cleanup a hook returns and runs them on disconnect (`#effectDisposers`). `UIFeat`
adds nothing to that contract; it only merges what a phase produced:

```
#phase(run):
  owned = []                 # effects started during this phase
  cleanup = run()            # the method's return value
  return () => { owned.forEach(dispose); cleanup?.() }
```

- `effect()` pushes onto `owned`, a single-slot collector that exists only while a phase runs. Outside a phase it is
  `null` and `effect()` throws: there is no connection to own the effect.
- The collector is saved and restored around `run()`, so a feature created inside another feature's phase cannot
  steal its effects.
- `connected`'s returned teardown calls `#phase`'s cleanup and then `disconnected()`. `disconnected` is not a host
  phase; it rides on the `connected` cleanup, so it runs on every disconnect with no new hook in `UIElementHooks`.

Order on disconnect: host `disconnect()`, directives' `disconnected()`, then every cleanup in registration order
(effects, returned cleanup, `disconnected()` per feature).

## Late attachment

`addHooks()` after connect replays `beforeConnect` and `connected` (plus `firstUpdated` if it ran), pushing the
cleanups onto the host's disposers. It uses `#hooksSettled`, set after the `connected` phase of the current
connection and cleared on disconnect, instead of `#connected`: a feature created inside the host's own
`connect()` must receive the normal phases, not a replay, or `connected` would run twice.

Known gap: a feature created from inside another feature's `connected` hook misses `connected` on that first
connection (the phase runner iterates a snapshot, and `#hooksSettled` is still false).

## `attachTo`

Registers one class hook per call: on the first `beforeConnect` of an instance it calls `create(host)`, stores the
result in a `WeakMap`, and returns the feature's own `beforeConnect` cleanup. The feature registered itself
with `addHooks` in its constructor, so every later phase (and later connects) arrive through it. It must deliver
`beforeConnect` by hand because the feature was created mid-phase and the phase runner iterates a snapshot taken
before it existed.

## Reactivity

A feature owns plain `signal` / `state` / `computed` values. A host's `template()` that reads them subscribes
through the normal render effect; no notification path exists between features and host.

## Non-goals

- Replacing directives: a feature changes behavior of an element; directives change how a binding renders.
- Ordering between features: they run in registration order; do not depend on it.
- A `disconnected` host hook: cleanups cover it (see the cleanup model).
