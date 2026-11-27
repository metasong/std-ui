# `effect()` — implementation design

How [`effect.ts`](./effect.ts), [`watch-signal.ts`](./watch-signal.ts) and [`scheduler.ts`](./scheduler.ts) work. For the user-facing API see [`README.md`](./README.md).

## Building blocks

`effect()` is built from two primitives of `signal-polyfill` (see [`../signal/tracking.ts`](../signal/tracking.ts)):

- **`Signal.Computed`** tracks what a function reads and caches its result. Its *equality cutoff*
  means it re-runs only if a source's value really changed.
- **`Signal.subtle.Watcher`** is a push-only subscriber. It never computes anything; it only calls
  `notify` when something it watches may have changed, then goes **inert** until `watcher.watch()`
  (no arguments) re-arms it.

`notify` runs **synchronously inside the writer's `set()`**, where reading or writing signals is
forbidden. So `notify` may only schedule work.

### A `Watcher` in miniature

```ts
import { Signal } from 'signal-polyfill';

const a = new Signal.State(1);
const b = new Signal.State(2);
const sum = new Signal.Computed(() => a.get() + b.get());   // watched below
const log = new Signal.Computed(() => `sum=${sum.get()}`);  // watched below

const watcher = new Signal.subtle.Watcher(() => queueMicrotask(flush));
watcher.watch(sum, log);

function flush() {
	for (const s of watcher.getPending()) {   // watched computeds that are currently stale
		s.get();                              // pull: this is what actually re-computes
	}
	watcher.watch();                          // re-arm for the next change
}

a.set(10);   // notify fires (once); flush is queued
b.set(20);   // watcher is already dirty: no second notify
// microtask: flush() -> getPending() = [sum, log] -> both recomputed once -> re-armed
```

What to take from it:

- `watch(sum, log)` subscribes the watcher; nothing is computed yet.
- `a.set(10)` marks `sum` stale, which marks its consumers stale, including the watcher, which calls
  `notify` synchronously. `notify` only queues `flush` (it must not read or write signals).
- `b.set(20)` finds the watcher already dirty, so there is no second notification. Two writes, one flush.
- `flush()` decides what to recompute. `getPending()` lists the stale watched computeds and `.get()`
  pulls each one. A computed that recomputes to an equal value does not propagate further.
- `watcher.watch()` with no arguments re-arms it. Without it the watcher would stay silent forever.

`effect()` is this pattern with one watcher and one computed per effect, where `flush` runs
`effect.run()` instead of looping over `getPending()`.

### One shared `Watcher` for many effects

One watcher can watch many computeds, so a single watcher could in principle serve every effect.
We do not do this yet; see [`shared-watcher.md`](./shared-watcher.md) for the idea, an example and
why not.

## Per-effect state: the `Effect` class

Each `effect()` call creates one `Effect` and returns its `dispose`:

| Field | Role |
|---|---|
| `#body` (`Signal.Computed<void>`) | Runs cleanup, then `monitoredAction`. Being a computed, it tracks the action's reads. |
| `#watcher` | Watches `#body`; its `notify` queues this effect. |
| `#cleanups` | `onCleanup` callbacks of the current run; `null` until the first registration (no allocation for effects without cleanup). |
| `#ran` | Set inside `#body`; tells `run()` whether the body really executed. |
| `#disposed` | Makes `notify`, `run` and `dispose` no-ops after dispose. |

Methods are on the prototype, so only the closures that need per-effect state are allocated per effect.

## Life cycle

```
effect(action, after)
  new Effect
    watcher.watch(body)          subscribe
    run()                        first run is synchronous (no deferred initial DOM sync)

signal.set(...)
  -> body marked stale
  -> watcher.notify              (synchronous, inside set)
       pending.add(effect); scheduleFlush()      one microtask, however many writes
  -> watcher is now inert

microtask: flush()
  batch = pending; pending = new Set()           swap, no copy
  for each effect: cycleGuard.count(fx); fx.run()

effect.run()
  body.get()                     recomputes only if a source really changed
  if (#ran) { #ran = false; after() }
  finally watcher.watch()        re-arm
```

### Why `run()` pulls with `body.get()`

A notification only means "maybe dirty". `body.get()` re-runs the action only if a source's value
changed. The cleanup and the action live **inside** the computed, so both are skipped on a false
alarm. `afterAction` is skipped too, through the `#ran` flag. It is paired with `monitoredAction`
and must not run without it.

### Why `finally { watcher.watch() }`

A watcher is inert after it notifies. Re-arming in `finally` means a throwing action cannot leave
the effect permanently deaf.

## Batching and flush

- `pending` is a `Set<Effect>`: an effect queued twice in a tick runs once.
- `flush()` **swaps** `pending` for a fresh set before running. Effects scheduled while flushing
  land in the new set and run in the **next** flush (a microtask later), not in the loop being
  executed.
- A throwing effect does not abort the loop: the rest are already out of `pending` and inert, so
  skipping them would kill them for good. All run, then errors are rethrown (a single error as is,
  several as an `AggregateError`).
- `whenFlushed()` resolves once nothing is pending **and** no flush is scheduled, so it covers
  cascades of any depth (effect A writes what effect B reads). Waiters are released in `finally`,
  so a throwing effect cannot hang them.

## Cleanup

- `onCleanup(fn)` pushes onto `#cleanups` (created lazily).
- `#runCleanup()` runs before each re-run (at the top of `#body`) and on dispose. It runs LIFO,
  inside `untrack`, so reads in cleanups are not recorded as dependencies of this effect.
- Every cleanup runs even if one throws; the first error is rethrown afterwards.
- Rationale: [`cleanup-design.md`](./cleanup-design.md).

## Dispose

`dispose()` is idempotent: marks disposed, removes the effect from `pending`, unregisters it from
the cycle guard, unwatches `#body` (so signals drop their reference to it), then runs cleanups.

An effect is referenced by every signal it read, so nothing collects it automatically. Call
`dispose()` when the owner goes away (`UIElement` does this on disconnect).

## Cycle guard

[`dev/effect-cycle-guard.ts`](./dev/effect-cycle-guard.ts) counts re-runs per effect across a
chain of consecutive flushes. Past 100 it clears `pending` and throws, so a cycle fails instead of
freezing the page in an endless microtask loop. See [`effect-cycles.md`](./effect-cycles.md).

- The counter runs in **all builds**.
- In `DEV`, each effect also records where it came from, to make the error readable:
  creation stack by default, or the effect body's source when
  `globalThis.__STD_UI_EFFECT_STACKS__ = false` (cheaper: `new Error()` costs about 7 µs per effect).

## Cost (rough, Node, 20,000 effects)

| | Prod | Dev, stacks on |
|---|---|---|
| Create (+ first run) | ~25–65 ms | ~155–210 ms |
| Memory per effect | ~1.5–2.4 KB | ~3 KB |
| One `set` re-running all | ~3–7 ms | ~3 ms |

A bare `computed` is roughly 2.5–3x cheaper to create than an effect.

## Possible future work

- **One shared `Watcher`** for all effects (see [`shared-watcher.md`](./shared-watcher.md)) (`getPending()` replaces the `pending` set). Saves a
  watcher and closure per effect; worth it only if `getPending()` / re-arm stay cheap with many
  mostly-clean effects. Benchmark first.
