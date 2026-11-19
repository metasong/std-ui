# Validator tracking: design

How validators interact with the reactive graph. User-facing docs: [`README.md`](./README.md).
The wiring lives in `createValidation` in [`../main.ts`](../main.ts).

## Graph

```
validators (signal) ─┐
node value (read()) ─┼─► errors (computed) ─┬─► valid ─────────┐
signals read by      │                      └─► errors          ├─► valid (+ children)
each validator ──────┘
validators + value + pending() reads ─► pending.own ─► pending (+ children)
```

- `errors` is one computed. Inside it, `read()` (the node's plain value) and `validators()` are
  read, then every validator is called. **A validator therefore runs inside a tracking context:**
  every signal or computed it reads becomes a dependency of `errors`.
- `validators` is a signal created with `equals: () => false`, so `validators.set([...])` always
  re-runs `errors`, even with an equal-looking list.
- `errors` uses `sameErrors` (flag + message, in order) as its `equals`, so a re-run that produces
  the same errors does not notify `valid` / `errors` / effects.
- `valid` = no errors **and** not pending. `valid` adds the same rule for every descendant and
  stops at the first failure.

## Decision: validators stay tracked

Validators are not wrapped in `untrack`. A validator that reads another signal
(`(v) => v === confirm() ? null : error`) must update when that signal changes; untracked, it
would go stale until the node's own value changed, and the failure would be silent. The value
itself is already a dependency through `read()`, so tracking only adds the extra reads the author
actually wrote. A validator that should not subscribe to a read wraps that read in `untrack(...)`.

Consequences for authors:

- Keep validators synchronous and pure: same inputs, same errors. Reads of other signals are fine.
- Tracking only covers code that runs synchronously inside the call. Anything after an `await`, or
  inside a timer, is not tracked (see async below).

## Built-in validators

| Validator | What is tracked |
| --- | --- |
| `required`, `length`, `range`, `pattern` | Only the node's value (they read nothing else). |
| `manual` | Its internal `state` signal, so `set` / `clear` re-run `errors`. |
| `async` | The wrapper reads internal signals (`settled`, `wanted`) and `deps`; the `check` callback is not tracked. |

### Manual validator

`set` / `clear` write the `state` signal, which notifies `errors`. Expiry is tracked without extra
signals: the first run after `set` records the value (`at`); a later run with a different value
sets `expired = true` and returns nothing. These are plain variables written inside the computed,
which is safe because they are only read by the same validator and never observed by other nodes.
They are deliberately not signals: writing a signal while a computed runs would notify the
computed that is currently running.

### Async validator

An async function cannot be tracked end to end: reads after the first `await`, or in a timer, have
no active tracking context. The validator splits the work:

1. **Tracked, synchronous (inside the `errors` / `pending` computeds).**
   `keyOf(value)` builds the cache key `{ value, deps }`, calling the user's `deps()`, so every
   signal `deps` reads is a dependency. Then it compares the key with the cached result
   (`settled` signal) and returns the cached errors, or nothing while the result is unknown.
2. **Untracked, asynchronous (timer).** `check(value, { abortSignal, deps })` runs from
   `setTimeout`. Its result is stored with `settled.set(...)`, which notifies the computeds.

Why the check is not run inside the computed: starting a request is a side effect, and a computed
may re-run any number of times and must not write signals (a write would notify the node that is
currently being computed). `ensure(key)` is idempotent per key and only schedules work:

- same key as the last request: do nothing;
- new key: abort the previous request, clear the pending timer, start a new timer
  (`debounce` ms).

Result handling, in order: ignore if aborted; ignore if `requested` is no longer this request;
otherwise `settled.set({ key, errors })`. Rejections of aborted checks are dropped; other
rejections go through `onError`.

Because `check` is untracked, signals it needs go through the `deps` option: they are read inside
the computed, included in the key, and handed back to `check` as `ctx.deps`.

### Pending

`Validator.pending?(value)` is optional. `createValidation` builds `pending` by calling it for
every validator with the node's value, **without early exit**: each call also runs `ensure(key)`,
so reading `pending` alone starts the request. Without that, a node whose `errors` nobody reads
could look "not pending" while still unvalidated.

`pending(value)` is a pure read (`settled` vs key) plus the idempotent `ensure`. The argument-less
form `validator.pending()` has no value to compare, so it uses the `wanted` signal: the last key
requested. `wanted` cannot be written from inside the computed either, so `ensure` sets it in a
`queueMicrotask`. This is why the direct form is `false` before the first read and lags a value
change by one microtask; `node.check.pending.own` (which passes the value) does not lag.

## Enabling: `when` and `check.enabled`

Both are plain reads inside the existing computeds, so they need no new tracking. `when` wraps
validators and forwards `pending`, short-circuiting on `enabled() &&` so a disabled async validator
is never asked (no `ensure`, no request). It drops `flag` because the constraint is conditional.
`check.enabled` is a signal checked at the top of `ownErrors` and `pendingOwn`; it covers the node's
own validators only, so parent aggregates see a disabled child as valid and not pending.

## Laziness

Computeds are lazy: nothing runs until something reads `errors`, `valid`, `pending` or their
aggregates. Async checks start on that first read, and a node nobody reads is never validated.

## Trade-offs

- **`wanted` microtask:** needed to avoid signal writes during a computed; cost is the one-tick lag
  of the argument-less `pending()`.
- **Latest-key cache only:** keeps memory flat and matches typical input; going back to an old
  value re-checks it.
- **`deps` is explicit:** it asks authors to list dependencies, instead of relying on tracking
  through `await`, which JavaScript cannot provide.
