# `class.name` / `style.prop` bindings

Toggle one class, or set one inline style property, from a template binding. Built only on
`@std-ui/core`'s public custom-attribute API; importing `@std-ui/ext` registers both.

```ts
t`<div class.active=${isActive} style.--accent=${color}></div>`;
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

## Files

- [`class-style.custom-attribute.ts`](./class-style.custom-attribute.ts) - `classAttributeExtension`, `styleAttributeExtension`.
- [`class-style.custom-attribute.test.ts`](./class-style.custom-attribute.test.ts) - tests.