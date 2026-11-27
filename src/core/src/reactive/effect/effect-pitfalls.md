# Effect pitfalls

Things that look fine, run without an error, and still give a wrong result. Each entry has the symptom, the cause, and the fix. See [`README.md`](./README.md) for the API and [`effect-cycles.md`](./effect-cycles.md) for loop detection.

## Pitfall: writing a signal the effect has already read

**Symptom.** The effect body reads a signal and then writes it. The signal changes and other consumers see the new value, but this effect does not re-run and keeps the result of its first read. Nothing throws and nothing is logged in production.

```ts
// Lost (1 run, ends at 1): reads `count`, then writes it inside the body
effect(() => {
  count.get();
  if (count.peek() < 3) count.set(count.peek() + 1);
});
```

### What is and is not affected

`monitoredAction` runs inside an internal `Signal.Computed`. The polyfill allows signal writes there (it only forbids them inside a `Watcher` notify), with or without `untrack`.

| Write from the body | Result |
|---|---|
| `other.set(x)`, `other` **not** read by the body | Works. Other consumers are notified normally. |
| `count.set(...)`, `count` **read earlier** by the body (`get()`) | **Update lost for this effect.** |
| `count.set(...)` **before** the first `count.get()` | Consistent: the read sees the new value. |

### Cause

The computed records the version it read, then the write bumps it during the same evaluation, and the computed marks itself clean at the new epoch (`lastCleanEpoch` in the polyfill's `graph.ts`). It never notices its own input changed, and the watcher is never notified. `untrack` does not matter: it only stops dependency tracking of reads, and the result is the same with a plain `set`.

The same thing with the bare polyfill, no library code (prints `1 1`: ran once, `count` is now 1, the second `get()` does not recompute):

```js
const count = new Signal.State(0);
let runs = 0;
const comp = new Signal.Computed(() => {
  runs++;
  count.get();
  count.set(1);
});
comp.get();
comp.get();
console.log(runs, count.get()); // 1 1
```

This is a known, open limitation of the signals polyfill, not specific to `effect()`. The proposal explicitly allows computeds to write signals ([proposal-signals#150](https://github.com/tc39/proposal-signals/issues/150)), and the stale-after-own-write behavior is reported in [proposal-signals#226](https://github.com/tc39/proposal-signals/issues/226) and [signal-polyfill#51](https://github.com/proposal-signals/signal-polyfill/issues/51). We added this repro and asked for a dev-mode warning or hook in [this comment on #226](https://github.com/tc39/proposal-signals/issues/226#issuecomment-7222270958).

### Fix

- Do not write a signal the body has already read (`get()`) from inside the body.
- To write a signal you also depend on and have the effect converge, do the write in `afterAction`. It runs outside the computed, so it is a normal write that re-notifies the effect (bounded by the cycle guard, 100 re-runs per chain).
- If the body only needs the current value, use `peek()` instead of `get()`: no dependency, nothing to lose.

```ts
// Converges (4 runs, ends at 3): the write is in afterAction
effect(
  () => { count.get(); },
  () => { if (count.peek() < 3) count.set(count.peek() + 1); },
);
```

### Dev warning

In DEV, `State.set` logs a one-time `console.warn` when the running computed/effect body has already read that signal (`reactive/signal/state.ts`, tests in `state-write-warning.test.ts`). It is not shown when the write is wrapped in `untrack()` (there is no active computed then), so that case stays silent. The warning is installed only in DEV and is absent from production builds.
