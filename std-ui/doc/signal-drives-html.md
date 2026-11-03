# Signals driving HTML template render

mini-ui pairs two ideas that stay useful on their own but work especially well together:

1. **Signals** — fine-grained reactivity (`signal`, `computed`, `effect`, or a `buildSignalTree()` app state).
2. **`html` + `render`** — lit-html-style tagged templates that patch the DOM in place instead of rebuilding it.

Wiring them up gives you declarative UI that updates surgically: when state changes, only the DOM nodes and attributes whose bound values actually changed are touched. No virtual DOM, no full `innerHTML` refresh on every tick.

## Why this combination is good

| Concern | What you get |
|---|---|
| **Updates** | `render()` reuses the same DOM nodes; `Part.update()` no-ops on `Object.is`-equal values (same rule as `signal.set`). |
| **Dependencies** | An `effect` re-runs only when signals it *read* change; branch changes in `computed`/`if` are tracked correctly each run. |
| **Batching** | Multiple synchronous `.set()` calls in one turn collapse to one effect flush (microtask), then one render pass. |
| **Authoring** | Markup stays in `html\`...\`` templates with attribute/event bindings; state stays in signals, not scattered DOM queries. |
| **Components** | `UIElement` already connects a `SignalTree` to `render()` for you; you can still drop to raw `effect` + `render` outside custom elements. |

The fireworks app uses this throughout `src/ui/components/` — e.g. `pause-button` swaps icon markup when `state.paused` changes, and `controls-bar` toggles layout classes from state while composing child custom elements in one template.

## Pattern A — Standalone: `effect` + `render` + signals

Use this for a widget, panel, or one-off view that is not a custom element. The effect is the "render loop": read signals, build a template result, pass it to `render`.

```ts
import { computed, effect, html, render, signal } from '../index.js';

const count = signal(0);
const label = computed(() => (count() === 1 ? 'click' : 'clicks'));

const container = document.getElementById('app')!;
const view = () => html`
	<p>You have <strong>${count()}</strong> ${label()}.</p>
	<button ?disabled="${count() >= 10}" @click="${() => count.update(n => n + 1)}">
		Increment
	</button>
`;

effect(() => {
	render(view(), container);
});

count.set(3); // effect re-runs → render patches text + disabled, same <p> and <button> nodes
```

Important details:

- **`view` must keep the same `html` call site** — always `return html\`...\`` from the same tagged template expression. If you switch to a *different* template literal (e.g. alternate `if` branches that each define their own `` html`...` ``), mini-ui tears down and rebuilds that container's DOM. Prefer one template with conditional *values* (`?disabled`, ternary in `${...}`) over conditional *templates* when you care about reuse.
- **`computed` for derived text** — keeps the effect from manually syncing extra fields; only re-read when dependencies change.
- **Event handlers** — `@click` bindings are re-bound when the handler reference changes; inline arrows are fine for demos, stable references are better in production.

## Pattern B — `UIElement`: state tree → `render(state)` → automatic `render`

For custom elements, you usually don't call `effect` + `render` yourself. Subclass `UIElement`, expose a `SignalTree` as `state`, and return `html` from `render`. `connect()` runs **before** the first `render`, so markup from your template is not in the DOM yet — put bindings and structure in `render`, and use `firstUpdated` / `updated` when you need to touch rendered nodes.

```ts
import { buildSignalTree, element, html, UIElement, type SignalTree } from '../index.js';

interface DemoState {
	counter: {
		value: number;
		max: number;
	};
}

const shared = buildSignalTree<DemoState>({
	counter: { value: 0, max: 10 },
});

@element('demo-counter')
class DemoCounter extends UIElement<DemoState> {
	protected override get state(): SignalTree<DemoState> {
		return shared;
	}

	protected override render(state: DemoState) {
		const { value, max } = state.counter;
		return html`
			<span>${value}</span> / ${max}
			<button
				type="button"
				?disabled="${value >= max}"
				@click="${() => shared.counter.value.update(n => n + 1)}"
			>+</button>
		`;
	}

	protected override firstUpdated(_state: DemoState): void {
		// Rendered light DOM exists now — safe to query children (not in `connect()`).
		this.querySelector('span')!.setAttribute('aria-live', 'polite');
	}
}

document.body.appendChild(document.createElement('demo-counter'));

shared.counter.value.set(5);           // write a leaf: shared.counter.value is a Signal
shared.counter.patch({ max: 20 });     // or patch a branch without touching sibling leaves
```

Nested objects become branch `Computed`s; leaves like `value` and `max` are writable `Signal`s on the tree (`shared.counter.value.set(...)`). In `render`, you read the plain snapshot `state.counter.value` — same shape as your interface. See [`../signal/tree.md`](../signal/tree.md) for `patch` and `.peak()`.

What `UIElement` does for you (see `component.ts`):

1. On **connect** (insertion into the document), runs `connect()` once for that connection cycle — **before** the first `render` — for host-only setup (attributes on `this`, timers, `this.effect()`). Do not assume rendered children exist yet.
2. Registers a render **`effect`** that reads `const state = this.state()`, calls `render(state)`, and if the result is a `TemplateResult`, passes it to `renderHtml(result, this)`.
3. After each render pass in that effect, calls **`firstUpdated(state)`** once (first pass only), then **`updated(state)`** every pass (including the first). Same idea as Lit's `firstUpdated` / `updated`, with the latest plain state snapshot instead of a `changedProperties` map.
4. On **disconnect**, runs `disconnect()`, disposes the render effect and any `this.effect(...)` you registered in `connect`, and resets first-update tracking so a later re-insert gets `connect()` and `firstUpdated()` again.

**Lifecycle order (each connection cycle):**

| Step | Hook | When |
|---|---|---|
| 1 | `connect()` | Before first `render`; one-time setup per connect cycle |
| 2 | `render(state)` | Whenever tracked state changes (and once immediately after connect) |
| 3 | DOM patch | Only if `render` returned `html\`...\`` |
| 4 | `firstUpdated(state)` | Once, right after the first successful render pass in step 2 |
| 5 | `updated(state)` | After every render pass, including the first (always after step 4 on the first pass) |

`this.state()` reads the tree root — a `Computed` that depends on every leaf — so any leaf write schedules another pass through steps 2–5.

Return `void` from `render` if you prefer imperative DOM updates (`querySelector`, `classList`, …); the same effect still runs on every state change, and `firstUpdated` / `updated` still run with the latest `state` even when you did not return a template.

Use **`firstUpdated(state)`** when you need DOM that only exists after the first `render` (measure layout, focus a field, `querySelector`, wire third-party widgets). Use **`updated(state)`** for work that must repeat after every state-driven render (sync aria attributes from state, notify parents). Keep **`connect()`** for setup that does not depend on rendered output (host attributes, registering `this.effect()`).

## Pattern C — Fine-grained `this.effect()` (avoid full re-render)

When only a sliver of DOM should track one signal, use `UIElement.effect()` after rendered nodes exist (typically in `firstUpdated`) instead of expanding `render(state)`:

```ts
protected override firstUpdated(): void {
	const badge = this.querySelector('.badge') as HTMLElement;

	this.effect(() => {
		badge.textContent = String(this.state().unreadCount);
	});
}
```

That effect is disposed on disconnect. Prefer **Pattern B** for structure and bindings; use **Pattern C** when profiling shows whole-template re-render is wasteful (e.g. a static shell with one live number). Register `this.effect()` from `connect()` only when it does not need rendered children.

## End-to-end data flow

```mermaid
flowchart LR
  subgraph write
    W["leaf.set() / patch()"]
  end
  subgraph react
    S[Signals / Computed]
    E[effect]
  end
  subgraph dom
    V["view() → html`...`"]
    R[render container]
    P[Parts patch in place]
  end
  W --> S
  S --> E
  E --> V
  V --> R
  R --> P
```

1. A write notifies subscribers.
2. The render `effect` runs (batched with other writes in the same tick).
3. `render(sameTemplate, container)` updates only changed parts.

## Feature checklist (demo these in the example test)

- **Text and attributes** — `${count()}`, `class="${cls}"`, `?disabled="${bool}"`.
- **Properties and events** — `.value`, `@click` (see `html.md` binding table).
- **Nested templates** — `html` inside `${...}` for conditional fragments without a second top-level template.
- **No-op updates** — `count.set(5)` when already `5` does not notify; DOM is not touched.
- **Derived state** — `computed(() => count() * 2)` inside the template or passed into `${...}`.
- **Fine-grained DOM** — `this.effect()` in `firstUpdated` to update a node omitted from `render` (Pattern C).
- **Post-render hooks** — `firstUpdated(state)` once, then `updated(state)` on every state-driven render pass (including the first).
- **Cleanup** — disconnect the element or call the `effect` disposer; no stray updates after teardown.

## Related reading

- [`../signal/signal.md`](../signal/signal.md) — primitives, tracking, batching, `peek`.
- [`../signal/tree.md`](../signal/tree.md) — `buildSignalTree`, `patch`, app-shaped state.
- [`../template/html.md`](../template/html.md) — binding kinds, limitations, `svg`, `unsafeHTML`.
- [`signal-drives-html.example.test.ts`](signal-drives-html.example.test.ts) — executable walkthrough of Patterns A, B, and C.
