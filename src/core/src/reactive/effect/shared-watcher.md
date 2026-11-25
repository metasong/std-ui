# One shared `Watcher` for many effects — idea and why not (yet)

Background for [`design.md`](./design.md). Today every `effect()` owns one `Signal.subtle.Watcher`.
This note explains how a single shared watcher could serve all effects, and why we have not done it.

## The idea

One watcher can watch **many** computeds (`watcher.watch(sum, log)`, see "A `Watcher` in miniature"
in `design.md`). Each computed is one effect body, so a single watcher can serve every effect.
`getPending()` then replaces the per-effect `pending` set.

```ts
const a = new Signal.State(1);
const b = new Signal.State(2);

// Two independent "effects": a body computed each, plus a map back to the work to run.
const effects = new Map<Signal.Computed<void>, () => void>();
function make(action: () => void) {
	const body = new Signal.Computed(action);   // tracks what `action` reads
	effects.set(body, action);
	shared.watch(body);                         // adds to the one watcher
	body.get();                                 // first run
}

const shared = new Signal.subtle.Watcher(() => queueMicrotask(flush));

make(() => console.log('A sees a =', a.get()));
make(() => console.log('B sees b =', b.get()));

function flush() {
	for (const body of shared.getPending()) body.get();   // only the stale ones recompute
	shared.watch();                                       // re-arm once for everyone
}

a.set(10);   // only A's body is stale; notify fires once, flush queued
// microtask: getPending() = [A.body] -> logs "A sees a = 10". B is not touched.
```

## Why it works

- The watcher is a subscriber, not a computation. Which effects are dirty is stored on the
  computeds themselves (stale flag), so `getPending()` can answer "who is stale" without a
  separate list.
- `a.set(10)` marks only the computeds that read `a` as stale. Effect B is clean, so it is absent
  from `getPending()` and does no work, however many effects are watched.
- The first `notify` makes the watcher inert, so any number of writes in one tick give one
  `notify` and one flush. One `watch()` re-arms it for all effects.

## What it saves and costs

- Saves one `Watcher` and one `notify` closure per effect.
- `getPending()` has to scan the watched computeds, so its cost depends on how many are watched.
- Per-effect behaviour still needs a map from computed to effect (cleanup, `afterAction`,
  dispose, cycle guard). Dispose must `unwatch(body)` on the shared watcher.
- Re-arm after each flush, even when an effect throws (same reason as `finally { watcher.watch() }`).

## Why not do it now

The notes above are cautions, not blockers. Nothing has been measured, so we hold off for these
reasons.

1. **The saving is small and unproven.**
   - Per-effect cost is already about 1.5–2.4 KB, and a watcher plus a closure is only part of it.
   - The body `Computed`, the `Effect` object and the cleanup bookkeeping stay the same.
   - A shared watcher would not change creation cost much.

2. **`getPending()` may cost more than it saves.**
   - The polyfill builds that list by walking every watched computed and checking whether it is stale.
   - With 20,000 effects and one changed signal, a per-effect watcher only does work for the
     affected effects. A shared watcher scans all 20,000 on every flush.
   - Many mostly-clean effects is the normal case for a UI with many components.
   - Today's design is O(affected) per flush; the shared one is O(all watched). That is a possible
     regression, for a one-time memory saving.

3. **Per-effect state still needs a lookup.**
   - Cleanups, `afterAction`, the `#ran` flag, dispose and the cycle guard hang off the `Effect`.
   - A shared watcher returns computeds, so you need a `Map<Computed, Effect>` (or a property on
     the computed) to get back to the effect. That costs memory and a lookup per run, which eats
     into the saving.

4. **Failure modes get worse.**
   - With a watcher per effect, a throwing effect can only silence itself, and
     `finally { watcher.watch() }` re-arms it.
   - With one shared watcher, a missed re-arm silences **every** effect in the app. A local bug
     becomes a global one.
   - Dispose needs `unwatch` on shared state. Forgetting it leaks, because signals keep a
     reference to the unwatched computed.

5. **Ordering and cascades are already correct today.**
   - The `pending` swap gives well-defined behaviour for effects scheduled while flushing, and
     `whenFlushed()` and the cycle guard rely on it.
   - A shared watcher would need those semantics re-proved, since its pending set and our
     "next flush" set would have to line up. That is a rewrite of the scheduling core for an
     unmeasured gain.

## Variant: a pool of watchers

A middle ground between one watcher per effect and one for all: a small set of N watchers
(for example one per ~64 effects, grown on demand), with each effect body assigned to one of them
(round-robin or hash).

How it works:

- Each pool watcher has its own `notify`, which queues a flush for that watcher.
- On flush, only the notified watchers call `getPending()` and pull their stale bodies.
- Only those watchers re-arm afterwards.

Compared with one shared watcher:

- **Scan cost** drops to about `total / N` per notified watcher, instead of scanning every effect.
- **Failure blast radius** drops: a missed re-arm silences about `1/N` of the effects, not all.

Compared with one watcher per effect:

- Saves `total - N` watchers and `notify` closures.

Costs:

- Scanning is still O(watched per watcher), not O(affected) as today. Clean effects that share a
  watcher with a dirty one are scanned for nothing.
- Ordering is harder: several watchers can flush in one tick, so the "next flush" semantics,
  `whenFlushed()` and the cycle guard must cover all of them.
- Dispose still needs a `Map<Computed, Effect>` and an `unwatch` on the right watcher.
- N is a tuning knob. A fixed N does not suit both 10 and 100,000 effects, which argues for
  growing the pool (a new watcher every K effects).

It is a better compromise than a single shared watcher, but the same objection applies: the only
gain is watcher and closure memory, which is unmeasured. Try it only after the benchmark below
shows watcher allocation matters.

## When it would be worth doing

- Profiling shows memory or creation time dominated by watcher allocation. This is more likely
  with per-part template effects, where effect counts grow by orders of magnitude.
- A benchmark with ~20,000 mostly-clean effects shows `getPending()` stays cheap.

Benchmark first, then decide.
