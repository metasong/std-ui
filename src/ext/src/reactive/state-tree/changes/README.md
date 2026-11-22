# `changes` — dirty tracking and `reset()`

Change tracking for state trees, next to `check` and `formUi`. A plain `stateTree()` has none;
`stateTree(...).with(changes)` (`import { changes } from '@std-ui/ext'`) adds `node.changes` to every node.
It is not part of the data: `deep()` never contains it.

| Member | Role |
| --- | --- |
| `node.changes.dirty()` | Tracked boolean: the node's current value differs (deeply) from the value it was created with. On a leaf, an explicit `equals` option replaces the deep comparison (e.g. `Object.is` or an id compare for large `'value'` data); containers always compare deeply. Editing back to the original makes it clean again. |
| `node.changes.initial()` | Tracked plain value `reset()` restores: the creation value, or the last `next` passed to `reset(next)`. |
| `node.changes.reset(next?)` | Writes the initial value back: edited values restored, members added since removed, deleted members re-created, a cleared object restored. Validators stay. With `next`, `next` first becomes the new initial value (pushed down to every child), so `reset(node.peek())` marks the current value as saved and a later `reset()` returns to it. Not an undo: it never steps back to the state before your last edit. |

```ts
import { stateTree } from '../index.js';
import { changes } from '@std-ui/ext';

const form = stateTree({ user: { name: 'a' }, tags: ['x'] }).with(changes);
form.user.name.set('b');
form.changes.dirty();       // true
form.user.name.changes.reset();
form.changes.dirty();       // false
```

## Notes

- The initial value starts as the value at creation; change it with `reset(next)`.
- On a `'value'`-depth tree, `dirty` is the single deep comparison of the value. Raw values in
  shallow / value trees are not walked, so a circular reference inside one would recurse forever when compared.
- Adopted (shared) nodes: `user.changes.reset()` writes the initial plain value back into the
  adopted node the same way, affecting every tree sharing it.
- `changes.reset()` does not touch `formUi` flags; call `formUi.untouchAll()` yourself.
