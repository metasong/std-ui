# Signal bindings: per-part updates (plan)

Status: implemented for child, plain-attribute, boolean-attribute and property positions
(`parts/signal-binding.ts`, used by `ChildPart`, `AttributePart`, `BooleanAttributePart` and
`PropertyPart`; tests in `parts/signal-binding.test.ts`). The demo, dev warnings, docs and teardown tests are done too (see "Remaining" for what is left).

Scope: `@event` and element positions are **not** changed (functions stay handlers).

Rule: a bare signal is followed in every value position (`${}`, `attr=`, `?attr=`, `.prop=`), so the
default means the same everywhere. `?attr` only reads `Boolean(value)`, so unwrapping loses nothing.

`.prop=${sig}` used to hand the signal object to the element. To keep that, wrap it: `raw(sig)`
(a plain helper in `property-part.ts`, not a directive). `PropertyPart` never follows a `raw()` value; once unwrapped it is an ordinary value and goes
through the same write path as any non-signal (a store field receives it via `.set()`). Parents already pass plain values into child stores (`writeProperty` calls
`.set()` on the child's store), so following the signal is what makes `.count=${parent.count}` useful;
passing a signal into `.set()` would store a signal inside the store. No `.prop` binding in the repo
passed a signal. `raw()` outside `.prop` has no meaning (dev warning still to do).

## Problem

`UIElement` runs `template()` inside one effect (`#wireTemplateUpdateEffect`). Any signal or computed
read in `template()` re-runs the whole function: the `t` call, every `${...}` expression and every
part comparison. Parts already skip DOM writes for `Object.is`-equal values, but all the work before
that check is wasted when the change only affects one slot.

## Goal

A signal change should re-run as little as possible: ideally one effect that patches one DOM slot,
and no re-run of `template()`.

## Core idea: the bound value decides who owns the update

The tag function cannot wrap `${this.count.get()}` in anything: JS evaluates the expression (and the
tracked read happens) before `t` is called. What `t` can see is *what kind of value* it received.

There are four cases. In every example, `template()` is the host's method and `count` / `view` are
signals on the host.

### Case 1: plain data (unchanged)

```ts
t`<p>${this.count.get()}</p>`
```

The signal is read inside `template()`, so the outer template effect tracks it. A change re-runs the
whole `template()`. This is today's behaviour and stays supported.

### Case 2: the signal itself (new, fine-grained)

```ts
t`<p>${this.count}</p>`
```

`template()` does not read `count`. The part receives the signal object, creates its own effect, and
patches that one text node. A change re-runs only that effect; `template()` is not re-run.

### Case 3: a template as a plain value, which contains signals

A `TemplateResult` is what `t\`...\`` returns. It can be placed in a child slot of another template:

```ts
t`
  <h1>${this.title}</h1>
  ${t`<p>${this.count}</p>`}
`
```

This adds no new rule. The nested template creates its own parts, and `${this.count}` inside it is a
Case 2 binding with its own effect. A change to `count` re-runs only that inner effect, not the outer
template and not the `title` part.

Lifecycle: when the slot swaps the nested template for something else, or the host disconnects, the
nested template's parts are released, so their effects are disposed (see step 3).

### Case 4: a signal that holds a template or a list

```ts
readonly view = state(t`<p>a</p>`);   // Signal<TemplateResult>
t`<main>${this.view}</main>`
```

Same as Case 2, but the slot is a child slot and the signal's value is a template (or an array). The
part's effect re-renders only that slot when `view` changes. Difference from Case 3: in Case 3 the
template is a fixed value containing signals; here the signal decides *which* template is shown.

### Summary

| Case | What is bound | Who tracks it | Re-runs on change |
|---|---|---|---|
| 1 | plain data (`${this.count.get()}`) | outer template effect | whole `template()` |
| 2 | the signal (`${this.count}`) | the part's own effect | that part only |
| 3 | a nested template value | the nested template's own parts (Case 2) | those signal parts only |
| 4 | a signal holding a template/list | the child part's own effect | that slot only |

If `template()` reads no signals (it passes signals through), the outer effect has no dependencies
and runs once. Plain reads keep today's behaviour, so nothing breaks.

## Open point: function bindings

An earlier draft said a function `${() => ...}` could be wrapped in a computed "like a signal".
That conflicts with how functions are already used, and with how closures work:

1. **Functions already mean something.** In `@event` slots a function is a handler
   (`event-part.ts`). In attribute/property slots a function may be a legitimate value (callback
   property on a child element, a directive argument). If the part auto-wrapped every function in a
   computed it would call event handlers and callback props at render time. So a bare function must
   **never** be treated as a thunk.
2. **An inline thunk is a new closure on every `template()` run.** "Wrap once" is only meaningful if
   the function identity is stable, and a computed's function cannot be swapped after creation.
   Swapping the latest closure into a fixed computed breaks correctness: values captured from locals
   that are not signals would go stale.

Decision:

- Functions keep their current meaning everywhere (handler, callback value). No implicit thunks.
- Derived bindings are explicit: the user passes a `computed(...)`, which is a signal, so it takes
  the signal path with no new concept. Created as a field or in `connect()`, so its identity is
  stable.
  ```ts
  readonly double = computed(() => this.count.get() * 2);
  template() { return t`<p>${this.double}</p>`; }
  ```
- Do not create a `computed` inline inside `template()`. It would be a new signal on every run, so
  the part would dispose and recreate its effect each time, which costs more than a plain
  `${this.count.get() * 2}`. Declare it as a field (above) so its identity is stable. No `derive`
  helper or other sugar is planned.
- Dev warning (optional): a function in a CHILD position is almost certainly a mistake. Warn that
  you should pass a `computed`, to avoid rendering `String(fn)`.

## Design of a signal part

A small helper shared by the value-taking parts (`ChildPart`, `AttributePart`, property parts), so
each part does not reimplement it:

```ts
class SignalBinding {
  #dispose?: () => void;
  #current?: Signal;
  bind(sig: Signal, apply: (v: unknown) => void) {
    if (sig === this.#current) return;       // same signal on re-render: no-op
    this.#dispose?.();
    this.#current = sig;
    this.#dispose = untrack(() => effect(() => apply(sig.get())));
  }
  release() { this.#dispose?.(); this.#dispose = this.#current = undefined; }
}
```

Rules:

- **Create the effect untracked.** `Effect`'s constructor runs once synchronously. If the part is
  created inside the outer template effect, the read would leak into its dependencies and make the
  outer effect re-run again.
- **Same signal across re-renders is a no-op.**
- **Swap:** signal A to signal B, or to a plain value: release the old effect, then bind the new.
- **Disposal:** `Part.disconnect()` / `dispose()` call `release()`. A disposed effect is removed
  from `pending`, so a parent disposing a child part in the same flush is safe.
- **Ordering:** all effects share the microtask flush. Many writes give one patch per slot.
- Nested template instances own their parts' bindings and release them when torn down.

## Open questions

- **`updated()` / `firstUpdated()`** run as the outer effect's `afterAction`, so part-level updates
  do not trigger them. First version: document that `updated()` means "template() re-ran".
- **Effect count** scales with signal bindings, not components (1,000 rows x 3 bindings = 3,000
  effects, about 2 KB each). See `reactive/effect/shared-watcher.md`: benchmark before changing
  the watcher strategy.
- **Lists:** `Signal<Item[]>` still diffs the whole child part on change. Per-item signals could
  come later.
- **Plain reads still re-run everything.** Dev-mode hint: warn when `template()` reads a signal a
  part could have owned.

## Steps

1. `isSignal(value)` and `SignalBinding` next to `parts/part.ts`.
2. Route signal values through it in `ChildPart`, `AttributePart`, `BooleanAttributePart` and the
   other value-taking parts, before the `Object.is` check. `EventPart` is untouched (functions stay handlers).
3. Make nested template instances / list renderers release their parts' bindings.
4. Tests:
   - one write patches only its own slot and `template()` is not re-run;
   - swap signal to signal and signal to plain;
   - dispose with no leaked effect;
   - creation inside the outer effect is untracked;
   - a function in an event slot or attribute slot is never called by the part.
5. Demo beside `computed-skip` with run counters.

## Remaining (to continue later)

Done: `SignalBinding`; child, attribute, `?attr` and `.prop` positions; `raw()` for `.prop`; tests in
`parts/signal-binding.test.ts` (child, attribute, boolean, property, `raw`, template-level, nested, unmount).

- [x] **Demo** beside `computed-skip`, with run counters showing `template()` is not re-run.
- [x] **Dev warnings:**
  - a function in a CHILD position: suggest passing a `computed`;
  - `raw()` used outside a `.prop` binding (it would be stringified);
  - optional: `template()` reads a signal that a part could have owned.
- [x] **Step 3 check:** list items and keyed rows (they call `part.update([value])` directly) release
  their parts' bindings on removal and teardown. Add a test with a signal inside a list item and a
  `mapByKey` row.
- [x] **Missing tests:**
  - a function in an attribute slot is never called by the part (event slots too);
  - dispose leaves no leaked effect (e.g. the effect count returns to zero after teardown);
  - a signal swapped to `raw(sig)` and back in `.prop`.
- [x] **Docs:**
  - `decorators/attribute/README.md` and `ext/doc/state-tree/README.md` say ".prop bindings pass plain
    values": mention that a bare signal is followed and `raw()` exists;
  - document that `updated()` means "template() re-ran" (see open questions);
  - mention `raw` in the template/directives docs.
- [x] **Audit:** grep every `.prop=${...}` for a signal passed as a value (only the first 80 of 244
  matches were reviewed). Wrap with `raw()` where the signal itself is wanted.
- [ ] **Open questions** (decisions, not blockers): effect-count benchmark vs `shared-watcher.md`;
  `Signal<Item[]>` still diffs the whole child part.

## Perf profile

Harness: `parts/signal-binding.perf.ts`. Run (PowerShell):

```
$env:NODE_OPTIONS='--expose-gc'; npx vitest run --config vitest.perf.config.ts --disable-console-intercept
$env:NODE_ENV='production'   # same, with DEV off (see below)
```

N rows, 2 bindings per row (`data-v=${x}` and a text child), median over 20-200 runs, jsdom (compare
the pairs, not the absolute numbers). `plain` = `${s.get()}`, `signal` = `${s}`.
`template()` ran 0 times in signal mode across all updates (plain: once per update).

### Production (DEV off)

**N=1000, plain / signal:**

| | Plain | Signal | Ratio |
|---|---|---|---|
| Update one row | 0.41 ms | 0.0019 ms | about 215x faster |
| Update all rows | 1.14 ms | 1.29 ms | 1.13x |
| Create + dispose | 14.95 ms | 16.6 ms | 1.11x |
| Heap per row | 3.7 KB | 6.3 KB | 1.7x (about 1.3 KB per binding) |

At N=10 and N=100 the cells vary by about 10%. Ratios there: update one row 2.3x / 22x faster, update all 0.98x / 1.11x,
create + dispose 1.04x / 1.06x.

Measured on the final code, with the one-signal fast path below: best of 12 interleaved timing runs and 4 fresh-process
heap runs, production, jsdom. The first round of this section had a noisier method and a wrong heap figure
(0.8 KB per binding), so it was replaced.

- Single-slot update is O(1) (about 2 us at any N) instead of O(N).
- Update-all is about equal to 1.1x slower with signals (N bindings patch vs one template diff).
- Create + dispose is about 1.05-1.1x slower; memory about 1.7x per row.

### One-signal fast path (`watchSignal`)

A binding of exactly one `state()` / `computed()` used to be `signal -> Computed (effect body) -> Watcher`. The computed
only tracked one read, so `SignalBinding.follow()` now uses `watchSignal()` (`reactive/effect/watch-signal.ts`) for that case: a
`Watcher` straight on the signal, in the same microtask flush as effects (same ordering, `whenFlushed()` and cycle guard),
with an `Object.is` cutoff against the last value it handed over (what the computed's equality used to provide).
Multi-slot attributes and state-tree nodes (not watchable) still use `effect()`.

Before -> after (production, 18 interleaved runs): signal heap per row 8.8 -> 6.3 KB (-28%); update-all about -15% at
every N; update-one -9% to -22%; create + dispose about -3% (noise). Plain rows are unchanged: a check with the direct
path switched off (12 runs) showed no difference, so the flush loop running two kinds of job costs nothing measurable.
Tests: `effect/watch-signal.test.ts`, plus the existing signal-binding tests.
### Dev (DEV on, the default in tests and unbundled pages)

Before the fix, create + dispose was about 3.5x slower for signals (74 ms vs 20 ms at N=1000) and
update-all about 1.9x. A CPU profile showed 54% of the time in `CycleGuard.register`
(`reactive/effect/dev/effect-cycle-guard.ts`), which builds `new Error()` per effect to remember its
creation stack; signal bindings create one effect per binding. `SignalBinding` itself was under 1%.

Fix (done): `effect(action, after, { name })`. A name replaces the dev creation stack and is printed in
cycle errors. `SignalBinding` passes `signal binding (child-part | attribute-part | boolean-attribute-part |
property-part)`: the stack of a part-owned effect would only point inside the library.
A cycle error now also prints `reads: state(5), computed, ...` per effect (the signals it reads, via
`Signal.subtle.introspectSources`, built only when the error is thrown); tests in `effect/effect-cycle.test.ts`.
Lowering `Error.stackTraceLimit` during capture was measured and does not help (7.6-8.4 us per effect at
any depth or limit, vs 1.6 us without capture): the cost is the capture, not the depth.

Dev mode on the final code (DEV on, 6 timing runs and 3 heap runs, same method as production):

**N=1000, plain / signal:**

| | Plain | Signal | Ratio |
|---|---|---|---|
| Update one row | 0.62 ms | 0.0023 ms | about 270x faster |
| Update all rows | 1.45 ms | 1.85 ms | 1.28x |
| Create + dispose | 16.9 ms | 23.3 ms | 1.38x |
| Heap per row | 3.8 KB | 9.0 KB | 2.4x |

Ratios at N=10 / N=100: update one row 2.5x / 22x faster, update all 1.13x / 1.18x, create + dispose 1.13x / 1.18x.

Dev is about 1.1-1.2x slower than production for plain and signal alike; the creation-stack cost is gone (create + dispose
was 74 ms for signals before the fix).

Takeaways:
- The release cost of per-binding effects is small. The dev-only stack capture inflated the first
  numbers. Use `globalThis.__STD_UI_EFFECT_STACKS__ = false` to profile dev builds without it.
- Use signal bindings for hot, sparse updates; keep plain reads where most bindings change together
  or rows are created and torn down in bulk.

Follow-ups:
- [ ] Re-measure in a real browser; jsdom DOM writes skew the update-all ratio.
- [ ] Evaluate the shared-watcher idea (`reactive/effect/shared-watcher.md`) for the remaining
  per-binding memory (about 1.3 KB after the one-signal fast path).

### Production profile and allocation trims (second round)

CPU profile in production mode (jsdom, N=1000): create is dominated by jsdom DOM work and GC (about 17%);
`SignalBinding` itself is about 1% self time. Update-all is jsdom attribute/text writes plus the signal
polyfill's notify/poll (about 11%) and the cycle guard's `count()` (about 3%); our part code is small.
So the remaining signal-vs-plain gap is the cost of N effects, not wasteful code in `SignalBinding`.

Changes made: `SignalBinding` takes its `apply` once (no closure per `update()`), uses plain loops instead of
`some/every/map`, and is created lazily by each part on the first signal value, so parts that only see plain
values no longer allocate one. Result (N=1000, production): plain rows 3.6 -> 3.5 KB; signal create +
dispose 18.6 -> 19.5 ms and heap 5.3 -> 5.5 KB per row, i.e. no measurable gain for signal bindings (the
timings move with machine load; use the ratios and the heap numbers). The lazy creation is the real win
(plain-only templates are slightly lighter); the rest is neutral.

Left ideas, in order: shared watcher (`reactive/effect/shared-watcher.md`), one effect per template
instance instead of per binding, lazy binding for off-screen rows (`virtualize`). Each needs a real-browser
measurement first, since jsdom DOM cost hides the effect overhead.

### Rigorous profile (third round): cost of the feature for templates without signals

Method (the earlier single-run numbers drifted with machine load and cannot support a decision):
`parts/signal-binding.perf.ts` measures `plain` and `signal` variants interleaved, 15 rounds per metric, and
`PERF_BASELINE=1` stubs `hasSignal()` to `false` (signal handling off) so a normal run and a baseline run can be
compared. `scripts/perf-compare.mjs <dir>` takes the best (lowest) value per metric across several process runs
(noise only slows a run down). Heap is measured in fresh processes (`PERF_HEAP_MODE=plain|signal`), because
after a GC V8 sweeps lazily and jsdom frees node wrappers late, which skews a second reading in one process.

```
$env:NODE_ENV='production'; $env:NODE_OPTIONS='--expose-gc'
# timing: alternate the order so process order does not bias it
foreach ($i in 1..6) { foreach ($b in ($i % 2 ? '1','0' : '0','1')) { $env:PERF_BASELINE=$b; $env:PERF_OUT="$out\t-$i-b$b.json"; npx vitest run --config vitest.perf.config.ts } }
# heap: one process per mode and variant
foreach ($m in 'plain','signal') { $env:PERF_HEAP_MODE=$m; $env:PERF_OUT="$out\h-$m.json"; npx vitest run --config vitest.perf.config.ts }
node scripts/perf-compare.mjs $out
```

Findings (production mode, jsdom, best of 6 alternating runs):

| Plain template (no signals), feature vs signal handling off | N=10 | N=100 | N=1000 |
|---|---|---|---|
| update one row | +2% | +12% | +20% |
| update all rows | +6% | +8% | +10% |
| create + dispose | +5% | +1% | 0% |
| heap per row | | | +0.7% |

- The first version of the check cost +18..34% on update-one-row. Cause: a `hasSignal` call per part per render,
  with `isReadableState` probing `.get`/`.peek` on primitives. Now primitives are rejected with an inline
  `typeof` in each part's `update()` (no call); objects still go through `isReadableState` (about 10 ns each).
  The list-item path (`ChildPart.update([templateResult])`) is the remaining hot spot: one object check per item.
- The baseline stub is slightly optimistic: it makes the whole signal branch dead code, so V8 inlines `update()`
  more aggressively than it can with the real branch present. A true "feature absent" build would sit between
  the stub and the numbers above.
- Signal bindings vs plain (feature on): update one row 0.46x / 0.05x / 0.01x (N=10/100/1000, much faster);
  update all 1.06x / 1.19x / 1.36x; create + dispose 1.10x / 1.15x / 1.26x; heap per row 3.75 KB plain vs 8.9 KB
  signal, i.e. about 2.6 KB per binding (the earlier 0.8 KB estimate came from an unreliable heap method).

Ideas to remove the remaining cost for plain templates (not done):
- Scan the flat `values` once per render, inside the `t` tag function or `updateParts`, and cache a
  `hasSignals` flag on the `TemplateResult`; parts then skip the per-part check unless the flag is set or the part
  is currently bound. This replaces N per-part checks with one tight loop.
- ~~Add a cheap brand for signals~~ tried, no measurable gain (see the ablation below).

### Ablation of the speed tweaks (production, interleaved runs, vs the version with all of them)

Each tweak was removed on its own. Differences within about 5% in either direction are noise.

| Tweak | Result when removed | Decision |
|---|---|---|
| `typeof` early return in `isReadableState` | noise | removed |
| `#follow` split out of `update()` | noise | removed (inline in `update()`) |
| `#applyResolved` / `#resolved` (no closure per `follow()`) | noise | removed (plain closure in the effect) |
| Inline `typeof` check in each part's `update()` | plain update 9-35% slower | kept |
| Lazy `SignalBinding` creation | plain heap +6.6% | kept |
| Call `hasSignal(values)` directly from `update()` instead of the inline check | plain update 6-32% slower | rejected |
| One-line `maybeSignal(value)` helper for the check | plain update 11-38% slower | rejected |

Lesson: the per-part inline `typeof` check is the one tweak that matters for plain templates. The inline check is repeated in four parts on purpose. A helper function costs a call per part per render, and V8 did not inline it. `AttributePart` also checks `values.length > 1`, because an attribute can have several slots.

Tried a brand check in `isReadableState` (`value instanceof State` first, structural fallback for computed, state-tree nodes and foreign signals): within about 5% in both directions on every row, so it was not adopted. `isReadableState` stays structural.

### Known quirk: `raw(sig)` then `sig` on the same property slot

After `raw(sig)` the element's property holds `sig`, which is a writable store. If the slot later goes back to `sig` (followed), `writeProperty` sees a store in the field and calls `sig.set(<its own value>)` instead of replacing the property, so the element keeps holding `sig`. Nothing breaks (the set is a no-op), but the property is not replaced by the plain value. Rare (a slot that alternates between `raw(sig)` and `sig`); tested only for follower counts. Decide later whether to document it or reset the field.

### Audit of existing `.prop=${...}` usages (done)

Searched `src/` (code, tests, docs). No usage binds a bare signal to a property, so nothing changes behaviour: `.value=${bind(...)}` and `formBind(...)` are directive results, not signals; `.checked=${todo.done}` in the state-tree array README iterates `.deep()`, which yields plain values; the remaining ones (`.items`, `.count=${this.tree.count.get()}`) pass plain values. Not checked: code outside `src/` (demos, other apps).
