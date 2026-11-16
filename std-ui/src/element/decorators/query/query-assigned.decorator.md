# `@queryAssignedNodes()`

Read-only field returning the nodes a parent projected into one of this component's slots. Re-read on every access (no cache, no reactivity).

```ts
@queryAssignedNodes(options?) field!: Node[];
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `slot` | `''` | Slot name; omit for the default slot |
| `flatten` | `false` | Include nodes of nested slots (shadow DOM only) |
| `selector` | - | Keep only elements matching the selector; text/comment nodes are dropped |
| `filter` | - | Custom type-guard `(node, index) => node is T`; applied after `selector` |

## Shadow vs light DOM

- **Shadow DOM** (`static shadowRootOptions` set): uses the native `<slot>.assignedNodes({ flatten })`.
- **Light DOM** (default): no native `<slot>`; reads the host's original children (snapshotted at first connect) grouped by `slot` attribute, no attribute = default slot. This is the same content the [`slot()` directive](../../template/directives/slot/README.md) projects; it works whether or not the template uses `slot()`, and keeps returning the nodes after they are moved into place.

## Examples

All nodes, including text:

```ts
@queryAssignedNodes({ slot: 'header' }) headerNodes!: Node[];
```

Elements only (the "query elements" case) - use `selector`:

```ts
@queryAssignedNodes<HTMLElement>({ slot: 'tab', selector: 'x-tab' })
tabs!: HTMLElement[];
```

Elements only without a specific selector - `selector: '*'`:

```ts
@queryAssignedNodes<HTMLElement>({ selector: '*' }) items!: HTMLElement[];
```

Custom filter (type guard narrows the field type):

```ts
@queryAssignedNodes({
	filter: (n): n is HTMLButtonElement => n instanceof HTMLButtonElement && !n.disabled,
})
enabledButtons!: HTMLButtonElement[];
```

Text nodes with content:

```ts
@queryAssignedNodes<Text>({ filter: (n): n is Text => n.nodeType === Node.TEXT_NODE && !!n.textContent?.trim() })
labels!: Text[];
```
