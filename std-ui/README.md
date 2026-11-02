# `signal.ts` usage

Generic, app-agnostic fine-grained reactivity primitives, Angular-signals-flavored:
`signal()`, `computed()`, and `effect()`. Safe to lift into any project, same as `./store.ts`.

## API at a glance

| Primitive | Create | Read | Write |
|---|---|---|---|
| `signal(initial)` | `const count = signal(0)` | `count()` | `count.set(5)` / `count.update(n => n + 1)` / `count.peek()` |
| `computed(fn)` | `const double = computed(() => count() * 2)` | `double()` | n/a (read-only, derived) |
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

### `computed(fn)`

A read-only value, lazily re-derived the next time it's read after one of its dependencies
changes (not eagerly on every write).

```ts
import { computed } from './signal.js';

const double = computed(() => count() * 2);

double(); // reads (and auto-tracks) count; recomputes only if marked dirty since last read
```

- Dependencies are rebuilt on every recompute, so conditional reads (`a() ? b() : c()`) are
  tracked correctly - whichever branch actually ran is what's subscribed to.
- A `computed` can itself be read by another `computed`/`effect`; changes propagate through the
  whole chain.

### `effect(fn)`

Runs `fn` immediately, then re-runs it whenever any signal/computed it read changes. Re-runs are
batched into a microtask, so multiple synchronous writes in the same tick only trigger one
re-run. Use this for side effects (DOM writes, logging, subscriptions) - not for deriving values
(use `computed` for that).

```ts
import { effect } from './signal.js';

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

## Where this fits in the ui-kit

- `./store.ts`'s `Store` is backed by a `Signal`, so `store.state` can be read inside a
  `computed()`/`effect()` (auto-tracked) in addition to the classic `subscribe()` API.
- `./component.ts`'s `UIElement.effect()` wraps `effect()` from this file, auto-disposing it on
  the element's `disconnectedCallback()` - use it for DOM slices that should react to specific
  signals without re-rendering the whole component.
