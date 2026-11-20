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

| Binding | Docs |
| --- | --- |
| `class.name=${on}`, `style.prop=${value}` | [`class-style/`](./class-style/README.md) |
| `@event.modifier=${handler}` | [`event/`](./event/README.md) |

## Files

- [`index.ts`](./index.ts) - exports `classAttributeExtension`, `styleAttributeExtension`,
  `eventModifiersExtension`, `ModifierEventPart`.