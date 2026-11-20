# `@event.modifier` binding

Replaces core's default `@` binding (which ignores modifiers) with `ModifierEventPart`, a subclass
of core's `EventPart`. Importing `@std-ui/ext` registers it.

```ts
t`<button @click.prevent.stop=${onClick}>Go</button>`;
```

| Modifier | Kind | Effect |
| --- | --- | --- |
| `.capture`, `.once`, `.passive` | option | Sets the matching `addEventListener` option |
| `.prevent` | filter | `event.preventDefault()` |
| `.stop` | filter | `event.stopPropagation()` |
| `.stop-immediate` | filter | `event.stopImmediatePropagation()` |
| `.self` | filter | Skips the handler unless `event.target === event.currentTarget` |

- Unknown or valued modifiers are ignored with a one-time `console.warn`.
- A handler's own `options` (from `withEventOptions`) override modifier-derived options.
- `:arg` is passed to extensions; with no matching extension it is ignored with a one-time warning.
- Modifiers beyond the built-ins are interpreted by [extensions](./extensions/README.md).

Implemented in [`event.custom-attribute.ts`](./event.custom-attribute.ts) via the `resolveOptions`
and `shouldHandle` hooks; see the core
[event README](../../../../../../core/src/element/template/custom-attributes/event/README.md).