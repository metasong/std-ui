# `signal/` usage

Generic, app-agnostic fine-grained reactivity primitives, Angular-signals-flavored in ergonomics
(callable reads, `.peek()`) but modeled internally on the
[proposed standard JavaScript `Signal`s API](https://github.com/tc39/proposal-signals):
`signal()`, `computed()`, and `effect()`. Safe to lift into any project.

Implementation lives under `./core/`: [`signal.ts`](./signal.ts) (writable values),
[`computed.ts`](./computed.ts) (derived values), [`effect.ts`](./effect.ts) (side effects),
[`tracking.ts`](./tracking.ts) (shared dependency graph). App code imports `signalState`, `computed`, and `effect` from [`../index.js`](../index.js); leaf `signal()` lives in [`./signal.ts`](./signal.ts) (internal).

## API at a glance

| Primitive | Create | Read | Write |
|---|---|---|---|
| `signal(initial)` | `const count = signal(0)` | `count()`/`count.peek()`  | `count.set(5)` / `count.update(n => n + 1)` |
| `computed(fn)` | `const double = computed(() => count() * 2)` | `double()` / `double.peek()` | n/a (read-only, derived) |
| `effect(fn)` | `effect(onCleanup => { ... })` | n/a (runs itself) | n/a |

### `signal(initial)`

A writable reactive value.

```ts
import { signal } from './signal.js';

const count = signal(0);

count();              // read (and auto-track if inside a computed/effect) -> 0
count.set(1);          // write -> notifies subscribers if the value actually changed
count.update(n => n + 1); // read-modify-write, returns the new value
count.peek();          // read WITHOUT tracking as a dependency
```

- `set`/`update` are no-ops (no notify) when the new value is `Object.is`-equal to the old one.
- Use `.peek()` inside a `computed`/`effect` when you need a signal's value but don't want
  changes to it to trigger a re-run.
- Pass `{ equals }` as a second argument to customize the change check, same role as
  `Signal.State`'s `equals` option in the proposal: `signal(value, { equals: (a, b) => ... })`.

### `computed(fn)`

A read-only value, lazily re-derived the next time it's read after one of its dependencies
changes (not eagerly on every write).

```ts
import { computed } from '../index.js';

const double = computed(() => count() * 2);

double();       // reads (and auto-tracks) count; recomputes only if marked dirty since last read
double.peek();  // same value, but does not track this computed as a dependency
```

- Use `.peek()` on a `computed` inside another `computed`/`effect` when you need its value but
  don't want changes to it to trigger a re-run (still recomputes lazily if dirty).
- Dependencies are rebuilt on every recompute, so conditional reads (`a() ? b() : c()`) are
  tracked correctly - whichever branch actually ran is what's subscribed to.
- A `computed` can itself be read by another `computed`/`effect`; changes propagate through the
  whole chain.
- Lazy caching and dirty invalidation: [`./computed-lazy.md`](./computed-lazy.md).
- Also accepts `{ equals }` (default `Object.is`, same as `Signal.Computed`'s option): on
  recompute, if the fresh value `equals()` the previously cached one, the old reference is kept
  instead of being replaced - useful so a parent `computed`/an `effect` doing its own reference
  checks on this value doesn't see spurious "changes".

### `effect(fn)`

Runs `fn` immediately, then re-runs it whenever any signal/computed it read changes. Re-runs are
batched into a microtask, so multiple synchronous writes in the same tick only trigger one
re-run. Use this for side effects (DOM writes, logging, subscriptions) - not for deriving values
(use `computed` for that).

```ts
import { effect } from '../index.js';

const dispose = effect(onCleanup => {
	el.textContent = String(double());

	// Optional: register cleanup to run before the next re-run, and on dispose.
	const id = setInterval(tick, 1000);
	onCleanup(() => clearInterval(id));
});

// Later, to stop future re-runs and run any pending cleanup:
dispose();
```

- The first run happens synchronously (not deferred a tick), so initial DOM sync isn't delayed.
- Call `onCleanup(fn)` inside the effect body to register teardown logic; it runs right before
  the next re-run and on `dispose()`.

## How dependency tracking works

While a `computed`/`effect` body is running, it's the single global "active consumer." Any
signal (or computed) read during that window records the active consumer as a subscriber.
When that signal later changes (via `.set`/`.update`), it notifies its subscribers:

- A subscribed `computed` just marks itself dirty and notifies its own subscribers in turn
  (it doesn't eagerly recompute - that happens lazily, on next read).
- A subscribed `effect` schedules itself into a shared microtask flush, so repeated writes in
  one tick collapse into a single re-run.

Each consumer's dependency set is rebuilt from scratch on every run, so stale subscriptions
from a previous run (e.g. a branch that's no longer read) are automatically dropped.

## Low-level primitives: `subtle`

`../index.js` also exports `subtle`, grouping two low-level primitives named after
`Signal.subtle` in the proposal. Most code should stick to `signal()`/`computed()`/`effect()` -
reach for these only when building a custom scheduler or framework integration on top of the
dependency graph (`effect()` itself is built on `subtle.Watcher`; see [`./effect.ts`](./effect.ts)):

- **`subtle.Watcher`** (`new Watcher(notify)`) - watches a fixed set of dependencies (via
  `.watch(...)`/`.unwatch(...)`) and fires `notify` once, synchronously, the moment any of them
  changes, then goes inert until re-`watch()`ed. `.getPending()` lists currently-dirty watched
  dependencies without forcing a recompute.
- **`subtle.untrack(fn)`** - runs `fn` with tracking suspended, even inside a `computed`/`effect`
  body, so any signal/computed it reads is not registered as a dependency. (`.peek()` is the
  single-read sibling of this for one signal/computed at a time.)

## Where this fits in std-ui

- `../tree.ts`'s `signalState()` mirrors a plain-object state shape into a tree of these
  `Signal`/`Computed` nodes - that's what backs an app's state (e.g. `core/store.ts`'s `appState`).
- `../../ui-element.ts`'s `UIElement` reads its `state` (a `SignalState<S>`) inside an `effect()` to
  drive `template()` on every change. `UIElement.effect()` itself wraps `effect()` from this folder,
  auto-disposing it on the element's `disconnectedCallback()` - use it for DOM slices that should
  react to specific signals without re-rendering the whole component.
- `../to-signal/README.md`'s `toSignal()` mirrors Promise/Observable-like sources into a
  read-only `computed` for the same template and effect consumers (see [`../to-signal/design.md`](../to-signal/design.md)).
