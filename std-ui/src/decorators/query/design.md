# `@query()` / `@queryAll()` / `@queryAsync()` — internal design

How these three decorators are implemented, and why they need no initializer and no `accessor`.
For usage and API, see [`README.md`](./README.md).

## Module split

| File | Owns |
|---|---|
| [`assert-plain-field.ts`](./assert-plain-field.ts) | `assertPlainField()` — the one piece of validation all three decorators share: throw unless `context.kind === 'field'`. |
| [`query.decorator.ts`](./query.decorator.ts) | `@query(selector, cache?)`. |
| [`query-all.decorator.ts`](./query-all.decorator.ts) | `@queryAll(selector)`. |
| [`query-async.decorator.ts`](./query-async.decorator.ts) | `@queryAsync(selector)`. |
| [`index.ts`](./index.ts) | Public re-exports, re-exported again from `../index.ts` / `../../ui-element.ts`. |
| [`query.test.ts`](./query.test.ts) | Behavior tests, through `UIElement`/`tag()`. |

Each decorator is its own file (unlike `@state()`/`@attribute()`, which share `../field-store.ts`'s
accessor/plain-field branching) because there's no shared *storage* mechanics here to extract -
only the `context.kind` check is common, and that's small enough to be a single function rather
than a module.

## Why a plain field decorator, not an accessor one

Every field decorated by one of these three never holds a value of its own - reading it always
runs a fresh `renderRoot.querySelector`/`querySelectorAll` (or, for `@query(selector, true)`, returns a
closed-over cache variable) against `this.renderRoot`. An `accessor` decorator's whole purpose is handing
back a replacement `get`/`set`/`init` triple backed by a *per-field storage slot* the `accessor`
keyword allocates - exactly what `@state()`/`@attribute()` need (see
[`../design.md`](../design.md)) and exactly what these three don't: there's no slot to back,
because there's no value to store. Requiring `accessor foo` here would add ceremony
(`@query('#x') accessor foo;` instead of `@query('#x') foo!;`) for no behavioral gain, and would
diverge from how read-only derived fields read elsewhere in this codebase (e.g. `@consume()`,
`../context/consume.decorator.ts`, which is plain-field-only for the same "nothing to back" reason).

So each decorator's returned function is called with a plain `ClassFieldDecoratorContext`, checked
by `assertPlainField()`, and wires up via `context.addInitializer()` + `Object.defineProperty()` -
the exact same technique `../field-store.ts` uses for a plain (non-`accessor`) `@state()`/
`@attribute()` field, minus any store:

```ts
context.addInitializer(function (this: UIElement): void {
	Object.defineProperty(this, key, {
		get(this: UIElement): T | null { return this.renderRoot.querySelector<T>(selector); },
		enumerable: true,
		configurable: true,
	});
});
```

No `set` is given, so writing the field throws (strict mode, no setter) - matching "read-only" in
the README.

## Why no initializer is needed

A naive version of the technique above - give the field no initializer at all
(`@query('#x') foo!: Foo | null;`) - looks like it should "just work": `addInitializer`'s callback
only needs to run once per instance, and a field with no initializer still gets *some* own
property created for the decorator to redefine... except under one specific condition, it doesn't.

TypeScript's `useDefineForClassFields` compiler option controls whether `tsc`/`esbuild` emit a
class field using real `[[Define]]` semantics (the actual JS spec behavior) or emulate the old,
pre-spec `[[Set]]`-based behavior. It **defaults to `false`** for any `target` below `ES2022` -
this project's `tsconfig.json` targets `ES2020` (for broader output compatibility), so without an
explicit override, it would default to `false`.

Under `useDefineForClassFields: false`, a decorated field **with no initializer** is treated by the
compiler as a type-only "ambient" declaration and erased from the emitted class entirely -
*including* the decorator application and the `addInitializer` callback it would have registered.
This can be confirmed by transforming the pattern through `esbuild` directly: the same decorator,
same field, same everything, with vs. without an explicit initializer, produces:

```js
// with an initializer (`missing = null`) - the field, the decorator, and the
// `addInitializer`-registered callback are all emitted and wired up correctly:
class Foo {
  constructor() {
    __publicField(this, "missing", __runInitializers(_init, 8, this)), __runInitializers(_init, 11, this);
  }
}

// with NO initializer (`missing!: Foo | null;`) - the field (and everything attached to it,
// including the decorator's registered initializer) is gone. `new Foo().missing` is `undefined`,
// not because the getter returned that, but because there is no getter at all:
class Foo {
}
```

This is exactly backwards from what `@query()` et al. want: *because* these decorators are
read-only and never use the field's own initial value, the field is naturally written with no
initializer (`title!: HTMLElement | null;`) - which is precisely the shape the compiler erases by
default at this project's `target`.

The fix is `tsconfig.json`'s `"useDefineForClassFields": true` (set explicitly, independent of
`target`) - this is the *actual* JS spec behavior for class fields (real `[[Define]]` semantics
always apply at runtime; `useDefineForClassFields` is purely a `tsc` emission-compatibility knob,
not a real runtime toggle), so turning it on doesn't change what any *valid* existing field does -
it only stops the compiler from erasing an initializer-less decorated field, letting
`addInitializer` run exactly as it would under a real engine's native class-field semantics.

**Caveat**: because of `strictPropertyInitialization` (part of `strict: true`), the field still
needs a definite-assignment assertion (`!`) or the compiler complains it's never assigned in the
constructor - hence `title!: HTMLElement | null;` rather than `title: HTMLElement | null;`. The `!`
is a type-checking-only annotation (erased at compile time); it doesn't affect emission the way the
initializer does.

## `@queryAsync()` and `UIElement.updateComplete`

For the user-facing “why not `@query()`?” narrative (deferred renders, conditional `template()`
branches, when to `await`), see [`README.md`](./README.md#why-queryasync-exists).

`@queryAsync()` is the one of the three that can't just run its query immediately - the whole
point is to wait until any render/effect re-run *currently pending* (from a signal write made just
before reading the field) has actually applied to the DOM. That wait is `UIElement.updateComplete`
(`../../ui-element.ts`):

```ts
public get updateComplete(): Promise<true> {
	return new Promise(resolve => {
		queueMicrotask(() => queueMicrotask(() => resolve(true)));
	});
}
```

Render re-runs are microtask-batched (`effect()`'s `scheduleFlush()` in
`../../signal/effect/main.ts` queues exactly **one** `queueMicrotask` per batch of synchronous
writes, then flushes every pending effect in it). `updateComplete` resolves after **two** nested
microtask hops specifically so that, no matter when within the current synchronous turn it's
requested, the pending flush's own single `queueMicrotask` has already had a chance to run and
complete before `updateComplete` resolves - one hop to "catch up" to whatever flush is already
queued, a second to run *after* that flush's own body (which is itself synchronous) has finished.

`@queryAsync()`'s getter is then just:

```ts
get(this: UIElement): Promise<T | null> {
	return this.updateComplete.then(() => this.renderRoot.querySelector<T>(selector));
}
```

Each read returns a fresh promise (no caching option, unlike `@query()`) - the field is meant to be
read right after a write whose effect you want to observe, so caching the result across reads would
silently serve a stale answer the next time it's needed.

## Related reading

- [`README.md`](./README.md) — public API and examples.
- [`../design.md`](../design.md) — `@state()`/`@attribute()`'s own field/accessor mechanics;
  `../field-store.ts`'s plain-field branch is where this folder's `addInitializer` +
  `Object.defineProperty` technique comes from.
- [`../context/design.md`](../context/design.md#why-a-plain-field-decorator-not-an-accessor-one) —
  `@consume()`'s own "plain field, nothing to back" rationale, for the same underlying reason.
- [`../../ui-element.ts`](../../ui-element.ts) — `UIElement.updateComplete`.
- [`../../signal/effect/main.ts`](../../signal/effect/main.ts) — the microtask-batched `effect()`
  re-run `updateComplete` waits on.
- [`query.test.ts`](./query.test.ts) — behavior tests.
