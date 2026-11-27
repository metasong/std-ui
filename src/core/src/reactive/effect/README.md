# `effect()` — tracked side effects

Runs a callback immediately, then re-runs it whenever any **signal** or **computed** read inside that callback changes. Re-runs are **microtask-batched**, so several synchronous writes in one tick collapse into a single re-run. Use this for side effects (DOM, logging, subscriptions) — not for derived values (`computed()` for that).

Broader API context: [`../signal/state.md`](../signal/state.md). Implementation: [`effect.ts`](./effect.ts) (with the shared flush in [`scheduler.ts`](./scheduler.ts)) on top of `Watcher` from [`../signal/tracking.ts`](../signal/tracking.ts) (same role as `Signal.subtle.Watcher` in the [proposal](https://github.com/tc39/proposal-signals)).

Writing to signals you also read: [`effect-cycles.md`](./effect-cycles.md). How it is implemented: [`design.md`](./design.md).

```ts
import { effect, state } from '@std-ui/core';

const count = state(0);

const dispose = effect(onCleanup => {
	el.textContent = String(count.get());

	const id = setInterval(tick, 1000);
	onCleanup(() => clearInterval(id));
});

dispose(); // stop watching; run pending cleanup
```

## API

### `effect(monitoredAction[, afterAction])`

| Argument | Role |
|----------|------|
| `monitoredAction` | Effect body. Receives `onCleanup` to register teardown. **Dependency-tracked** — only signals/computeds actually read on the latest run are subscribed. |
| `afterAction` | Optional. Runs right after `monitoredAction` whenever it actually ran (initial and real re-runs; skipped when a notification turns out to be a false alarm). **Not tracked** — reads there do not add dependencies or trigger re-runs. |

Returns `dispose()`: unsubscribes the effect, removes it from the pending flush queue, and runs any registered cleanup.

**Lifetime.** An effect is held strongly by every signal it read, and holds its body's closure. Nothing collects it automatically (the same contract as `Signal.subtle.Watcher` in the TC39 proposal), so an effect on a long-lived signal (module-level state, a store) keeps everything it closes over alive until you call `dispose()`. Inside a `UIElement`, effects created through `this.effect()` / `connect()` are disposed on disconnect for you; elsewhere (modules, services, tests) keep the returned function and call it when the owner goes away.

### `onCleanup(fn)`

Call inside the effect body. `fn` runs **before the next re-run** and once more when you call `dispose()`.

- Registration happens during the tracked body, but **running** cleanup happens **outside** `runTracked` (right before the next tracked run, or on dispose). Reads inside `fn` are **not** recorded as dependencies of this effect.
- You can call `onCleanup` **multiple times** per run. All are kept and run in **reverse order** (LIFO). If one throws, the rest still run and the first error is rethrown afterwards. The list resets before each re-run.
- Rationale and alternatives: [`cleanup-design.md`](./cleanup-design.md).

Prefer `peek()` / `untrack()` in the main body when you need a value without subscribing. Cleanup is already outside this effect’s tracking window; if an outer `computed` / `effect` is active, reads in cleanup can still attach to that outer consumer.

### First run and batching

- The **first** run is **synchronous** on creation (initial DOM sync is not deferred a tick).
- After a dependency change, the effect is queued into a shared microtask **flush**; multiple effects and multiple writes in the same tick share one flush pass.
- Before re-running, a **pull** check (`sourcesChanged`) skips work if no read dependency’s version actually moved (equality cutoff), same as the rest of the graph.

## Pitfalls

Writing a signal the body has already read (`get()`) from inside the body silently leaves the effect stale: do that write in `afterAction` or read with `peek()`. Details and the dev warning: [`effect-pitfalls.md`](./effect-pitfalls.md).

## `afterAction` vs cleanup

| | Runs when | Tracked reads |
|---|-----------|----------------|
| `monitoredAction` | Initial + every re-run | Yes |
| `afterAction` | After each `monitoredAction` run | No |
| `onCleanup` callback | Before next re-run + on `dispose()` | No (for this effect) |

## std-ui usage

- [`../../element/ui-element.ts`](../../element/ui-element.ts) — `UIElement.effect()` wraps this and auto-disposes on `disconnectedCallback()`.
- [`../state-tree/main.ts`](../state-tree/main.ts) — field reactions and template refresh build on the same primitives.

## Tests

Behavior is covered in [`effect.test.ts`](./effect.test.ts); use `flushEffects()` from [`test-helpers.ts`](./test-helpers.ts) in tests to await the microtask flush.