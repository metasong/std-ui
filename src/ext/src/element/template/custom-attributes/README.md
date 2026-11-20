# `@std-ui/ext` custom attributes

Extra template bindings built only on `@std-ui/core`'s public custom-attribute API
(`registerCustomAttribute`). Importing `@std-ui/ext` registers all of them.

```ts
import '@std-ui/ext';
import { t } from '@std-ui/core';

t`<button
  class.active=${isActive}
  style.--accent=${color}
  @click.prevent.stop=${onClick}
>Go</button>`;
```

## `class.name=${on}`

Toggles one class by truthiness (`classList.toggle(name, Boolean(value))`).

## `style.prop=${value}`

Sets one inline style property with `setProperty` (kebab-case; `--custom` works).
`null`, `undefined` or `false` removes it.

Both bindings:

- Take exactly one modifier naming the entry; `:arg` and valued modifiers throw.
- Only match when a modifier or arg is present, so plain `class="..."` / `style="..."` are untouched.
- Re-apply only when the value changes (`Object.is`).

Implemented in [`class-style.custom-attribute.ts`](./class-style.custom-attribute.ts)
(`classAttributeExtension`, `styleAttributeExtension`); tests in
[`class-style.custom-attribute.test.ts`](./class-style.custom-attribute.test.ts).

## `@event.modifier=${handler}`

Replaces core's default `@` binding (which ignores modifiers) with `ModifierEventPart`, a subclass
of core's `EventPart`.

| Modifier | Kind | Effect |
| --- | --- | --- |
| `.capture`, `.once`, `.passive` | option | Sets the matching `addEventListener` option |
| `.prevent` | filter | `event.preventDefault()` |
| `.stop` | filter | `event.stopPropagation()` |
| `.stop-immediate` | filter | `event.stopImmediatePropagation()` |
| `.self` | filter | Skips the handler unless `event.target === event.currentTarget` |

- Unknown or valued modifiers are ignored with a one-time `console.warn`.
- A handler's own `options` (from `withEventOptions`) override modifier-derived options.
- `:arg` throws.

Implemented in [`event.custom-attribute.ts`](./event.custom-attribute.ts) via the `resolveOptions`
and `shouldHandle` hooks; see the core
[event README](../../../../../core/src/element/template/custom-attributes/event/README.md).

## Files

- [`index.ts`](./index.ts) — exports `classAttributeExtension`, `styleAttributeExtension`,
  `eventModifiersExtension`, `ModifierEventPart`.
