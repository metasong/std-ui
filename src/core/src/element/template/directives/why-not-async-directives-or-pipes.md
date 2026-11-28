# Why no async directive or pipe?

Frameworks often expose **async in templates** as either:

- an **async pipe** that subscribes to an `Observable` / `Promise` and updates the view when values arrive (Angular’s `AsyncPipe`), or
- an **async directive** that holds subscription state inside the binding and re-renders when the latest value changes.

std-ui does **not** ship either. Async work is bridged **once** into the signal graph with [`toSignal`](../../../../../ext/src/reactive/to-signal/README.md) and [`toSignalFrom`](../../../../../ext/src/reactive/to-signal/README.md#reactive-sources-tosignalfromfactory-options), then templates read ordinary signals in `` t`...` `` — the same path as `@store()`, `computed()`, and DOM-driven updates.

That keeps template bindings **synchronous**, matches the rest of the signal model, and avoids a second subscription lifecycle hidden inside `${...}`.

## Why not an async pipe or directive?

| Concern | Pipe / async directive in `${...}` | `toSignal` / `toSignalFrom` + signals |
|--------|--------------------------------------|----------------------------------------|
| Subscription lifetime | Tied to each render or each binding instance; easy to leak or double-subscribe | One bridge per source; explicit `dispose()` / `onCleanup` |
| Reactive reads | Template layer must know Promise vs Observable vs “latest value” | `computed()` and `template()` only see **current** signal values |
| Signal-dependent sources | Another special case in The factory or directive protocol | `toSignalFrom(() => …)` re-runs the factory when deps change |
| Errors | Often swallowed or turned into empty UI unless the pipe has branches | Reads **throw** the error (Angular parity); branch in `template()` with try/catch in a `computed` wrapper, or guard before read |
| Directive surface | Would require async/`ElementPart` plumbing we deliberately trim | Already documented as out of scope in [`../tag-funcs/html/html.md`](../tag-funcs/html/html.md#directives) |

The template engine updates the DOM when **signals** (or other bound values) change. Promises and observables do not participate in that graph until they are mirrored into a signal. A pipe would be a thin wrapper around the same bridge — with worse lifetime rules if you call it from `template()` on every pass.

## Use `toSignal` for a fixed async source

Create the bridge **once** (field initializer, module scope, or `connect()`), not inside `template()` — see [`../../../../../ext/src/reactive/to-signal/README.md`](../../../../../ext/src/reactive/to-signal/README.md#lifetime).

**Promise** (e.g. load user on connect):

```ts
import { tag, t, UIElement, toSignal } from '@std-ui/core';

@tag('demo-profile')
class DemoProfile extends UIElement {
	private readonly user = toSignal(fetch('/api/me').then((r) => r.json()), {
		initialValue: null as { name: string } | null,
	});

	protected override template() {
		const u = this.user.get();
		return t`
			<section>
				${u === null ? t`<p class="loading">Loading…</p>` : t`<p>Hello, ${u.name}</p>`}
			</section>
		`;
	}
}
```

**Observable-like** sources (e.g. RxJS `interval` in the app — std-ui only needs `subscribe`):

```ts
import { tag, t, UIElement, toSignal } from '@std-ui/core';
import { interval } from 'rxjs';

@tag('live-clock')
class LiveClock extends UIElement {
	private readonly tick = toSignal(interval(1000), { initialValue: 0 });

	protected override template() {
		return t`<span>${this.tick.get()}</span>`;
	}
}
```

Until the first emission, use `initialValue` (or accept `undefined` on read). After `dispose()`, the last good value remains.

## Use `toSignalFrom` when the source depends on signals

When the URL, filter, or id comes from component state, use a **factory** so the previous subscription is torn down when deps change:

```ts
import { tag, t, UIElement, store, toSignalFrom } from '@std-ui/core';

@tag('demo-user-by-id')
class DemoUserById extends UIElement {
	@store() userId = 1;

	private readonly profile = toSignalFrom(
		() => (this.userId.get() ? fetch(`/api/users/${this.userId.get()}`).then((r) => r.json()) : null),
		{ initialValue: null as { name: string } | null },
	);

	protected override template() {
		const p = this.profile.get();
		return t`
			<button type="button" @click=${() => this.userId.update((id) => id + 1)}>Next id</button>
			${p === null ? t`<p>…</p>` : t`<p>${p.name}</p>`}
		`;
	}
}
```

While a new fetch is pending, the **last** successful value is kept (see [`../../../../../ext/src/reactive/to-signal/README.md`](../../../../../ext/src/reactive/to-signal/README.md)).

## Patterns in `template()`

- **Loading UI** — branch on `initialValue` / `null` / a dedicated `@store()` flag you set in an `effect`.
- **Derived display** — `computed(() => format(this.items.deep()))` instead of awaiting inside the literal.
- **Lists from async** — resolve in `toSignal`, then `this.rows.get().map((row) => t\`...\`)` or `mapByKey` (same as sync data).
- **Errors** — wrap reads that may throw in a small `computed` that returns a result type, or handle failure upstream and store an error signal yourself; do not expect a built-in “async pipe with error slot”.

Calling `toSignal` / `toSignalFrom` inside `template()`, `computed()`, or `effect()` **throws** (`assertNotInReactiveContext`) so subscriptions are not recreated on every reactive pass.

## What we add instead

| Need | Built-in | Alternative |
|------|----------|-------------|
| Show latest async value | — | `toSignal` / `toSignalFrom`, then `${state()}` |
| React to signal-changing sources | — | `toSignalFrom(() => …)` |
| Conditional async UI | — | `? :` on signal reads (see [`why-not-structure-directives.md`](./why-not-structure-directives.md)) |
| DOM-specific async (e.g. virtual list measure) | `virtualize` | Not a generic async pipe |

Further detail: [`../../../../../ext/src/reactive/to-signal/README.md`](../../../../../ext/src/reactive/to-signal/README.md) · [`../../../../../ext/src/reactive/to-signal/design.md`](../../../../../ext/src/reactive/to-signal/design.md).
