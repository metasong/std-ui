# `toSignal()` — internal design

Async → signal bridge. Usage and API: [`README.md`](./README.md).

## Problem

Signals are **synchronous reads** with fine-grained subscriptions. Observables and Promises produce values **over time**. Templates and `computed()` need a current value on every read, so async sources must be mirrored into the signal graph.

Angular solves this with `toSignal` in `@angular/core/rxjs-interop`. std-ui copies the **core mechanics** but drops RxJS, `DestroyRef`, and injection context — lifetime is explicit (`dispose` / `onCleanup`).

## Mental model

```text
source (Subscribe | Promise)
        │
        ▼ subscribe / then
  writable state: Value | Error
        │
        ▼ computed unwrap
  ToSignal (read-only façade)
```

| Piece | Responsibility |
|-------|----------------|
| `toSubscribable()` | One code path: Promise → one-shot `Subscribable`; `Symbol.observable` unwrapping. |
| Internal `state` `signal` | Holds tagged union: success value or error. |
| Public `computed` | Returns value; **throws** on error kind (not stored as a third signal type consumers must branch on). |
| `dispose` | Unsubscribe + ignore late promise results. |

## Data flow

1. **`toSignal(source, options)`** runs (preferably outside any tracked consumer).
2. **`untrack`**: wiring the subscription must not register stray dependencies if the caller is accidentally inside an `effect`.
3. **`state`** initialized to `{ kind: Value, value: initialValue | undefined }`.
4. **`subscribe`**: each `next` → `state.set(Value)`; `error` → `state.set(Error)` and teardown; `complete` → teardown (the last value is kept).
5. Returned **`computed`** reads `state`, throws on `Error`, else returns `value`.

Observable **completion** does not change the signal type or clear the value — same as Angular (signals have no “complete” state).

## Why not depend on RxJS

The runtime contract is three methods:

```ts
subscribe(observer: PartialObserver<T>): Unsubscribable;
```

RxJS `Observable` implements that. So do small hand-rolled sources in tests, some store implementations, and future TC39 interop shapes. Types live in [`types.ts`](./types.ts) so apps can add `rxjs` only where they use operators.

## Promise vs Observable

| | Observable-like | Promise |
|--|-----------------|---------|
| Values | Many `next` | One resolve or reject |
| Teardown | `unsubscribe()` | `active = false` flag (promise cannot abort) |
| After `dispose` | Unsubscribe | Late resolve ignored |

Both funnel through `toSubscribable()` before subscribe.

## Equality

Internal `state` uses custom `equals` on the **wrapped** state objects: when both sides are `Value`, delegate to `options.equals` on the **emitted** values (default `Object.is`). Transitioning to/from `Error` always notifies.

## Lifecycle (vs Angular)

| Angular | std-ui |
|---------|--------|
| `DestroyRef.onDestroy` | `onCleanup` callback or `.dispose()` |
| `manualCleanup` | default: caller must pass `onCleanup` or call `dispose`; no hidden global scope |
| `assertNotInReactiveContext` | Enforced (always on); use `subtle.untrack` to create inside an `effect` |

`UIElement.effect(onCleanup => toSignal(..., { onCleanup }))` matches component lifetime to [`../../ui-element.ts`](../../ui-element.ts) disconnect disposal.

## Deliberate omissions

| Feature | Reason |
|---------|--------|
| `requireSync` | Rare for promises; observables that emit synchronously on subscribe already work without an option. |
| `toSignalFrom(() => …)` | Needs an `effect` + cancel pattern; keep API small until requested. |
| `LoadState` union (pending/ok/error) | Errors throw on read (Angular parity); apps can wrap if templates need non-throwing branches. |
| `toObservable` | Inverse bridge; separate module if added. |

## Files

| File | Owns |
|------|------|
| [`types.ts`](./types.ts) | Public `Subscribable`, options, `ToSignal` type. |
| [`subscribable.ts`](./subscribable.ts) | Detection helpers + `toSubscribable()`. |
| [`to-signal.ts`](./to-signal.ts) | State machine + `toSignal()` overloads. |
| [`index.ts`](./index.ts) | Re-exports. |
| [`to-signal.test.ts`](./to-signal.test.ts) | Promise, sync emit, error, dispose, `onCleanup`. |

Depends on [`../core/`](../core/signal.md) (`signal`, `computed`, `untrack`).

## Reactive-context guard

`toSignal()` calls [`assertNotInReactiveContext`](../core/tracking.ts) at entry (same rule as Angular): if `activeWatcher` is set, throw. That blocks accidental `toSignal` inside `computed`, `effect`, or template render, where each re-run would leak subscriptions.

When async work **depends on signals**, use **`toSignalFrom(factory)`** (future) or an `effect` that owns `.set()` / dispose per run — not raw `toSignal` inside the tracked body.

## Future extensions

- **`toSignalFrom(factory, options)`** — `effect` with per-run cancel; `factory` may read signals.
- **Optional `AbortSignal`** in options for fetch factories (policy, not core subscribe).
- **Dev-only `debugName`** on inner signals (parity with Angular DevTools).

## Differences from Angular

- **No equireSync.** Observables that emit synchronously during subscribe already work (the value is kept), but there is no option to enforce it and no "guaranteed sync, `T` only" overload. For promises it is a poor fit anyway: native promises always settle on a microtask.
- **`assertNotInReactiveContext`** runs on every `toSignal()` call (not dev-only), same intent as Angular. It is also exposed on `subtle` for other one-shot subscribe helpers.
- **No signal-dependent sources.** There is no `toSignalFrom(() => fetch(...))`. Wrap `toSignal` in an `effect` with `subtle.untrack` and `onCleanup` instead.
