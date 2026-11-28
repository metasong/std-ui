# Why `count.get()` and not `count()`?

Signals used to be callable: `count()` read, `count.set(1)` wrote. They are now real standard signals:
`count.get()` reads, `count.set(1)` writes, `count.peek()` reads untracked.

```ts
const count = state(0);
const double = computed(() => count.get() * 2);

effect(() => console.log(double.get())); // tracked read
count.set(2);
count.update((n) => n + 1);              // returns the new value
count.peek();                            // untracked read
```

## Why

`state()` and `computed()` are built on `Signal.State` / `Signal.Computed` from the TC39
[signals proposal](https://github.com/tc39/proposal-signals) (via `signal-polyfill`). The proposal
reads with `.get()`. A function can never be a `Signal.State`: the polyfill brand-checks every signal
(`typeof s === 'object' && #brand in s`), and a private brand can't be added to an existing function.

Keeping `count()` would have meant a wrapper function next to a hidden real signal, plus a lookup
table to get from one to the other. Using the standard shape instead:

| | callable `count()` | standard `count.get()` |
|---|---|---|
| Works with `Signal.subtle.Watcher` | only through an unwrap step | directly |
| Works with other standard-signal libraries / Lit's `watch()` | no, needs the real signal | yes, it *is* the real signal |
| Extra code in std-ui | wrapper, accessor-to-signal map, own `Watcher` wrapper | none; `State` / `Computed` are small subclasses |
| Reads in code and templates | shorter | `.get()` is explicit that a tracked read happens |

`State` and `Computed` only *add* `peek()` (and `update()` on `State`) to the standard class, so they
stay assignable to `Signal.State` / `Signal.Computed`.

## What changed

- `x()` becomes `x.get()` everywhere: `state`, `computed`, `createRef()`, `store()` nodes
  (`node.get()`, `node.shallow()`, `node.deep()`), `check.errors.get()`, `formUi.touched.get()`, ...
- `ReadableSignal<T>` is `{ get(): T; peek(): T }`. `State<T>` and `Computed<T>` are classes.
- `subtle.Watcher` is the polyfill's `Signal.subtle.Watcher`, unwrapped. `watcher.watch(count)` just works.
- `when(enabled, ...)` accepts a signal (`{ get(): boolean }`) or a plain `() => boolean`.
- `bind(sig)`: a signal is recognised by having `get`, `set` **and** `peek`. A plain accessor
  `bind({ get, set })` has no `peek`, so the two forms stay distinct.
- Store object nodes are plain objects now, not functions. `get` joins the reserved API names
  (`set`, `update`, `peek`, `deep`, `shallow`, ...), so a member called `get` is reached through
  `obj._.get`.

## Not callable any more, on purpose

An accessor passed where a function is expected no longer works as one:

```ts
const items = [1, 2, 3].map(count);        // before: calls count(item)
const items = [1, 2, 3].map(() => count.get()); // now
```

Pass a thunk (`() => count.get()`) wherever an API wants "a function that reads".

## What this does not change

- Effects are still microtask-batched and still built on `Signal.subtle.Watcher`; see `reactive/effect`.
- `peek()` and `update()` are std-ui additions, not part of the proposal. Code that must run on bare
  `Signal.State` should use `Signal.subtle.untrack(() => s.get())` and `s.set(f(s.get()))`.
- The polyfill is a preview of an in-progress proposal. Two copies of `signal-polyfill` on one page
  do not interoperate, so apps that share signals with another library should dedupe it.

## Alternatives considered

- **Keep `count()` and expose the real signal on demand** (`count.raw`, as Angular bridges its own
  callable signals to the standard). Smallest diff, but every consumer of the standard needs the
  bridge, and a writable signal would leak from every `computed`.
- **`Proxy` that is both callable and a signal.** Fails the polyfill's brand check (`#brand in proxy`
  is false), so it buys nothing.
