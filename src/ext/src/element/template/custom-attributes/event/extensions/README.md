# Event extensions

Extend `@event.modifier` bindings with new modifier semantics. Design: [design.md](./design.md).

```ts
t`<input @input.debounce:200=${search} />`;
t`<input @keyup.ctrl+enter.shift+y=${submit} />`;
```

| Extension | Binding | Effect |
| --- | --- | --- |
| `debounce.ts` | `@x.debounce[:ms]` | Runs the handler after `ms` (default 300) without a newer event |
| `key-combo.ts` | `@keyup.ctrl+enter.shift+y` | Runs only if any combo matches: `mod+...+key`, mods `ctrl shift alt meta` held exactly |

## Writing one

```ts
import { registerEventExtension } from './event-extension.js';

registerEventExtension({
	filter: info => info.name === 'click' && info.modifiers.some(m => m.name === 'throttle'),
	handler: (handler, info) => event => handler(event),
});
```

- `info` is core's `AttributeInfo` without `sigil`: `{ name, arg?, modifiers }`.
- Only the first registered extension whose `filter` passes is used (no composition).
- `handler` may return a dispose function; see the design doc.
- Register before the template is instantiated, via a side-effect import in `index.ts`.
