# `slot`

Light-DOM slots. Projects the children a parent wrote inside your component at a chosen position.
Bind it in a child position:

```ts
import { t, slot, UIElement, tag } from '@std-ui/core';

@tag('x-card')
class Card extends UIElement {
	protected template() {
		return t`
			<header>${slot('title')}</header>
			<main>${slot()}</main>
			<footer>${slot('footer', t`<small>default footer</small>`)}</footer>`;
	}
}
```

```html
<x-card>
	<h1 slot="title">Hello</h1>
	<p>body text</p>
</x-card>
```

- `slot(name?)` - children with `slot="name"` go here; no `slot` attribute means the default slot (`slot()`).
- `slot(name, fallback)` - `fallback` (a `t` template) renders only when nothing is assigned to that slot.
- Native `<slot>` only works in shadow DOM. With `static shadowRootOptions` set, use `<slot>` instead; `slot()` is for
  the default light-DOM mode. In dev builds, using `slot()` in a shadow-DOM component throws.
- Projected nodes are the parent's own nodes, moved (not cloned), so their state, listeners and custom-element
  identity are kept. They are inserted once and left alone on re-render.
- Text nodes (including whitespace) belong to the default slot, as in native slots.
- Only valid in child positions; attribute, property or element bindings throw.
- Children are snapshotted when the component first connects. They must already exist then (script-created elements,
  or markup already parsed when the element is upgraded). Children added later are not projected.
- A component that never uses `slot()` is unaffected: the snapshot is just a list of references, no DOM is changed.
- A slot can only be projected once per host: using the same name twice moves the nodes to the last position.

Reading slotted content from the component: [`@queryAssignedNodes`](../../../decorators/query/query-assigned.decorator.md)
reads the same captured content in light DOM (and the native `<slot>` in shadow DOM).

Implementation: `SlotRenderer` in `index.ts`, handed to `ChildPart` via `renderWith()`; capture in `slot-content.ts`.
