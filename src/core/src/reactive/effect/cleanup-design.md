# Design: `onCleanup` in `effect()`

Why `effect()` takes a body that receives an `onCleanup(fn)` registration function, and how it behaves.
API reference: [`README.md`](./README.md). Implementation: [`main.ts`](./main.ts).

## Decision

```ts
effect(onCleanup => {
	const id = setInterval(tick, 1000);
	onCleanup(() => clearInterval(id));
});
```

- `onCleanup` is a **registration** function passed into the body.
- It can be called **any number of times** per run; every cleanup is kept.
- Cleanups run in **reverse registration order** (LIFO), before the next re-run and on `dispose()`.
- If a cleanup throws, the remaining ones **still run**; the first error is rethrown afterwards.
- Cleanups are **per run**: the list resets before each re-run.

## Why registration, not the alternatives

### Alternative A: second argument, `effect(action, cleanup)`

```ts
let id;
effect(
	() => { id = setInterval(tick, 1000); },
	() => clearInterval(id),
);
```

- The cleanup lives outside the body, so it can't see locals created in the run. It needs shared
  mutable outer variables, which is error-prone:

  ```ts
  let id: number | undefined;            // outer variable just to share state
  effect(
  	() => { id = setInterval(tick, 1000); },
  	() => clearInterval(id),             // `id` may be stale or undefined
  );
  ```

- It can't express "only clean up if this branch ran" or "several resources". The cleanup runs
  every time and must re-check what happened:

  ```ts
  let handler: (() => void) | undefined;
  let timer: number | undefined;
  effect(
  	() => {
  		if (!enabled.get()) return;          // nothing acquired on this run
  		handler = () => resize();
  		window.addEventListener('resize', handler);
  		timer = setTimeout(poll, 500);
  	},
  	() => {
  		// Must guard every resource, and reset them by hand.
  		if (handler) window.removeEventListener('resize', handler);
  		if (timer !== undefined) clearTimeout(timer);
  		handler = timer = undefined;
  	},
  );

  // With registration, each cleanup sits next to what it releases, and only runs if registered:
  effect(onCleanup => {
  	if (!enabled.get()) return;
  	const handler = () => resize();
  	window.addEventListener('resize', handler);
  	onCleanup(() => window.removeEventListener('resize', handler));
  	const timer = setTimeout(poll, 500);
  	onCleanup(() => clearTimeout(timer));
  });
  ```

- If the body throws midway, the cleanup has to guess what was acquired:

  ```ts
  let a: Resource | undefined;
  let b: Resource | undefined;
  effect(
  	() => {
  		a = acquireA();
  		b = acquireB();                  // throws -> `b` stays undefined, `a` is held
  	},
  	() => { a?.release(); b?.release(); }, // must null-check everything
  );

  // With registration, `a` is already registered when `acquireB()` throws, so it is released:
  effect(onCleanup => {
  	const a = acquireA();
  	onCleanup(() => a.release());
  	const b = acquireB();                // throws, but a's cleanup is already registered
  	onCleanup(() => b.release());
  });
  ```

### Alternative B: return a cleanup (React / Svelte / Preact signals)

```ts
effect(() => {
	const id = setInterval(tick, 1000);
	return () => clearInterval(id);
});
```

- Closes over locals, which is good, but allows only **one** cleanup; multiple resources must be
  combined by hand.
- Awkward with early returns and conditional resources.
- An accidental return value (e.g. an arrow body returning something) can be mistaken for a cleanup.
- Doesn't compose with `async` bodies.

### Chosen: registration callback

- Closes over locals and supports conditional and multiple cleanups.
- Resources registered before a throw are still released.
- Same model as Solid (`onCleanup`), Angular (`effect` + `onCleanup`, `DestroyRef.onDestroy`) and
  Vue 3.5+ (`onWatcherCleanup`).

## Why LIFO

Later resources often depend on earlier ones (e.g. a listener attached to an element created earlier).
Releasing in reverse acquisition order mirrors `defer` / destructors and avoids use-after-release.

## Why keep running after a throw

One failing cleanup must not leak the others. Every cleanup is attempted; the **first** error is
rethrown after all have run, so failures stay visible without hiding later teardown.

## Tracking

Registration happens inside the tracked body, but cleanups **run** outside this effect's tracking
window, so reads inside them are not dependencies.

## Prior behavior

Earlier versions kept a single slot: each `onCleanup` call replaced the previous one, so earlier
cleanups were silently dropped. That looked like registration but behaved like "return a cleanup".
