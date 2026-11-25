# `toSignal()` — async streams into signals

Bridge **Observable-like** sources (`subscribe`) and **Promises** into a read-only signal you can use in `computed()`, `template()`, and `UIElement` state — modeled on [Angular’s `toSignal`](https://angular.dev/api/core/rxjs-interop/toSignal), without RxJS or Angular DI.

Design notes: [`design.md`](./design.md).

```ts
import { toSignal, t, tag, UIElement } from '@std-ui/core';
import { interval } from 'rxjs'; // app dependency; std-ui does not bundle RxJS

@tag('live-ticker')
class LiveTicker extends UIElement {
	private readonly counter = toSignal(interval(1000), { initialValue: 0 });

	protected override template() {
		return t`<span>${this.counter.get()}</span>`;
	}
}
```

## API

### `toSignal(source[, options])`

| `source` | Behavior |
|----------|----------|
| `Subscribable<T>` | Subscribes immediately; signal tracks the **latest** `next` value. |
| `PromiseLike<T>` | One shot: value after it resolves; rejection is surfaced as an error. |
| `[Symbol.observable]()` / `'@@observable'()` | Unwrapped to a `Subscribable` (RxJS interop objects). |

Returns `ToSignal<V>`: a **`computed`** (callable read + `.peek()`) with `.dispose()`.

### Options

| Option | Role |
|--------|------|
| `initialValue` | Value before the first emission. Without it, reads return `undefined` until then. |
| `equals` | Custom equality for consecutive values (default `Object.is`). |
| `onCleanup` | Registers `dispose()` — e.g. pass `UIElement`’s `effect(onCleanup => ...)`. |

### `dispose()`

Unsubscribes from observable sources, or **ignores** a pending promise result. The **last** successful value is kept (nothing is written to a “completed” sentinel — signals do not complete).

### Errors

Errors are terminal: the subscription is released after `error` (and after `complete`). If the source calls `error`, **reading** the signal **throws** that value (same idea as Angular). Handle with `try/catch` in imperative code, or guard in templates.

## RxJS and other libraries

std-ui ships only minimal types: [`Subscribable`](./types.ts), `PartialObserver`, `Unsubscribable`. RxJS `Observable` matches `Subscribable` structurally — no cast required. Your app adds `rxjs` as its own dependency.

## Lifetime

Call **`toSignal` once** per source (field initializer, module scope, or `connect()`). Calling it inside `template()`, `computed()`, or `effect()` **throws** (`assertNotInReactiveContext`), because each call would start another subscription.

**With `UIElement`:**

```ts
protected override connect(): void {
	this.effect(onCleanup => {
		// `effect` bodies are tracked, so wrap in `subtle.untrack` or `toSignal` throws.
		subtle.untrack(() => {
			this.user = toSignal(fetch('/me').then(r => r.json()), {
				initialValue: null,
				onCleanup,
			});
		});
	});
}
```

Passing `onCleanup` ties disposal to the same rules as other component `effect()`s (auto-dispose on disconnect).

## Reactive sources: `toSignalFrom(factory[, options])`

Use it when the source depends on signals. `factory` runs in a tracked context; when a signal it reads changes, the previous subscription is disposed and the factory re-runs.

```ts
const user = toSignalFrom(() => fetch(`/users/${this.id.get()}`).then(r => r.json()), { initialValue: null });
```

- Returning `null`/`undefined` means "no source right now".
- The last good value is kept while the new source is pending; a previous error is cleared on re-run.
- If `factory` throws, reads throw that error until the next re-run.
- Same options and return type as `toSignal`; `dispose()` stops the effect and the current subscription.
- Like `toSignal`, it throws inside a reactive context (create it once).

Without `toSignalFrom`, 
use an `effect` that creates the `toSignal` inside `subtle.untrack` and passes `onCleanup` (so each re-run disposes the previous one), or call `.then` + `signal.set` yourself until a dedicated `toSignalFrom(factory)` helper exists (see [`design.md`](./design.md)).

## Files

| File | Role |
|------|------|
| [`types.ts`](./types.ts) | Public types |
| [`subscribable.ts`](./subscribable.ts) | Promise / `Symbol.observable` normalization |
| [`to-signal.ts`](./to-signal.ts) | `toSignal()` implementation |
| [`index.ts`](./index.ts) | Package exports |
