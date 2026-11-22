# `@querySlotted()`

Read-only field returning the nodes a parent projected into one of this component's slots. Re-read on every access (no cache, no reactivity).

```ts
@querySlotted(options?) field!: Node[];
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `slot` | `''` | Slot name; omit for the default slot |
| `flatten` | `false` | Include nodes of nested slots (shadow DOM only) |
| `selector` | - | Keep only elements matching the selector; text/comment nodes are dropped |
| `filter` | - | Custom type-guard `(node, index) => node is T`; applied after `selector` |

## Examples

All nodes, including text:

```ts
@querySlotted({ slot: 'header' }) headerNodes!: Node[];
```

Elements only (the "query elements" case) - use `selector`:

```ts
@querySlotted<HTMLElement>({ slot: 'tab', selector: 'x-tab' })
tabs!: HTMLElement[];
```

Elements only without a specific selector - `selector: '*'`:

```ts
@querySlotted<HTMLElement>({ selector: '*' }) items!: HTMLElement[];
```

Custom filter (type guard narrows the field type):

```ts
@querySlotted({
	filter: (n): n is HTMLButtonElement => n instanceof HTMLButtonElement && !n.disabled,
})
enabledButtons!: HTMLButtonElement[];
```

Text nodes with content:

```ts
@querySlotted<Text>({ filter: (n): n is Text => n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim() })
labels!: Text[];
```

## Illustrative example: a tab strip

A `<x-tabs>` component reads its own `<x-tab>` children to build a tab bar, and shows the selected one. The tabs are plain children written by the parent; the component never needs to know how many there are.

```ts
import { t, tag, UIElement, state, querySlotted } from '@std-ui/core';
import { slot } from '@std-ui/ext';

@tag('x-tabs')
class XTabs extends UIElement {
	readonly selected = state(0);

	// Live read of every <x-tab> the parent put in the default slot.
	@querySlotted<HTMLElement>({ selector: 'x-tab' }) tabs!: HTMLElement[];

	protected override template() {
		return t`
			<nav>
				${this.tabs.map((tab, i) => t`
					<button type="button"
						aria-selected=${i === this.selected()}
						@click=${() => this.selected.set(i)}>
						${tab.getAttribute('label')}
					</button>`)}
			</nav>
			<section>${slot()}</section>`;
	}

	protected override updated() {
		// Show only the selected panel; the nodes themselves stay in place.
		this.tabs.forEach((tab, i) => (tab.hidden = i !== this.selected()));
	}
}
```

Usage:

```html
<x-tabs>
	<x-tab label="Profile">Name, avatar...</x-tab>
	<x-tab label="Billing">Plan, invoices...</x-tab>
	<x-tab label="Security">Password, 2FA...</x-tab>
</x-tabs>
```

What happens:

1. On connect the children are snapshotted, so `tabs` holds the three `<x-tab>` elements even after `slot()` moves them into `<section>`.
2. `selector: 'x-tab'` skips whitespace text nodes and any stray non-tab element.
3. Clicking a button updates `selected`, which re-renders; `updated()` re-reads `tabs` and toggles `hidden`.

The same code works with `static shadowRootOptions` set: replace `slot()` with a native `<slot></slot>` and `tabs` is read through `<slot>.assignedNodes()` instead.

## Illustrative example: shadow DOM card

With a shadow root the template uses native `<slot>` elements, and `@querySlotted` reads what the browser assigned to them. Here a card hides its header and footer when nothing was slotted, and reports how many items it received.

```ts
import { t, tag, UIElement, state, querySlotted } from '@std-ui/core';

@tag('x-card')
class XCard extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	readonly hasTitle = state(false);
	readonly itemCount = state(0);

	@querySlotted<HTMLElement>({ slot: 'title', selector: '*' }) titleEls!: HTMLElement[];
	@querySlotted<HTMLElement>({ selector: '*' }) items!: HTMLElement[];

	// `slotchange` fires when assigned nodes change (and once after the first assignment).
	#sync = () => {
		this.hasTitle.set(this.titleEls.length > 0);
		this.itemCount.set(this.items.length);
	};

	protected override template() {
		return t`
			<style>
				:host { display: block; }
				header[hidden] { display: none; }
				::slotted([slot='title']) { margin: 0 0 .5rem; }
			</style>
			<article>
				<header ?hidden=${!this.hasTitle()}>
					<slot name="title" @slotchange=${this.#sync}></slot>
				</header>
				<slot @slotchange=${this.#sync}></slot>
				<small>${this.itemCount()} item(s)</small>
			</article>`;
	}
}
```

Usage:

```html
<x-card>
	<h3 slot="title">Release notes</h3>
	<p>Fixed a bug.</p>
	<p>Added a feature.</p>
</x-card>
```

What happens:

1. `slot[name="title"]` and the default `<slot>` are found by the decorator in the shadow root; `titleEls` is `[<h3>]` and `items` is the two `<p>` elements (the `<h3>` is assigned to the named slot, so it is not in the default list).
2. `selector: '*'` drops whitespace text nodes between the elements.
3. The getters are not reactive, so `slotchange` copies the counts into `state`, which is what re-renders the template.
4. Appending another `<p>` later fires `slotchange` again and the count updates. If you misspell a slot name in the decorator (for example `slot: 'titel'`), the read returns `[]` and DEV mode warns once that the shadow root has no such `<slot>`.

Shadow vs light DOM behavior and internals: [design.md](./design.md).
