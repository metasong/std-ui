# Writing signals inside effects

An effect can write to a signal it also reads, for example:

```ts
effect(() => {
  arr.shallow(); // subscribes to the structure signal
  arr.push(x);   // nodes.set(...) -> notifies (equals: () => false)
});
```

Without protection this re-queues itself after every run and spins forever in microtasks, which
freezes the page with no error. Two guards prevent that.

## 1. Self-write guard (`../core/tracking.ts`, `notify`)

If a dependency notifies a watcher **while that same watcher is running**, the notification is
ignored. The example above runs once.

Trade-off: the effect read the state *before* its own write, so it does not re-run to observe the
result. If you need that, split the write into a separate effect, or read with `peek()`.

## 2. Cycle guard (`main.ts`, `flush`)

The self-write guard cannot see indirect cycles: effect A writes what B reads, and B writes what A
reads. `CycleGuard` (`dev/effect-cycle-guard.ts`), used by `flush()`, counts re-runs per effect
across consecutive flushes (the count resets when a flush leaves nothing pending). After
`MAX_RERUNS_PER_CHAIN` (100) it clears the queue and throws an error instead of freezing. The
limit applies in all builds.

In **dev** (`DEV` from `dev/flag.ts`: `globalThis.__STD_UI_DEV__` or `process.env.NODE_ENV !==
'production'`), the error also shows **where the involved effects were created**. Each `effect()`
stores a plain `Error` at creation (V8 formats `.stack` lazily); the frames are only read when a
cycle is reported. Production builds still throw on a cycle, but only list run counts.

## Guidelines

- Prefer `peek()` / `untrack()` for reads that should not subscribe.
- Array mutators (`push`, `splice`, ...) use `nodes.peek()` internally, so calling them in an effect
  does not subscribe by itself. Only an explicit tracked read (`()`, `shallow()`, `deep()`, `length`, `at()`)
  does.
- An effect that must react to its own output should be split in two. With the self-write guard,
  `if (arr.length < 5) arr.push(x)` pushes only once per trigger instead of converging to 5; use a
  plain `while` loop inside the effect for that.
