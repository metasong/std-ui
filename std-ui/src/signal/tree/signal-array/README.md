# Signal array (`signalArray`)

Observable reactive collections for the signal tree. Each array element is its own node (typically
from `signalState()`), while a separate internal signal tracks **which nodes exist and in what
order**. That split gives fine-grained subscriptions: effects on `list.at(i)` only re-run when that
slot or its value changes; effects on `list()` also react to structural edits.

Implementation details: [`design.md`](./design.md).

## Standalone usage

```ts
import { signal, effect } from '../../core/index.js';
import { signalArray } from './index.js';

const list = signalArray([1, 2, 3], (n) => signal(n));

effect(() => console.log(list())); // [1, 2, 3]
list.at(0)!.set(10);               // only index-0 effects + whole-list readers
list.push(4);
```

## Via `signalState()`

Any array on the initial value becomes a `SignalArray` automatically:

```ts
import { signalState } from '../core.js';

const state = signalState({ tags: ['a', 'b'] });
state.tags.push('c');
state.tags.at(0)!.set('z');
state(); // { tags: ['z', 'b', 'c'] }
```

Nested object elements are full `SignalState` branches:

```ts
const todos = signalState([{ text: 'buy milk', done: false }]);
todos.at(0)!.done.set(true);
todos.at(0)!(); // { text: 'buy milk', done: true }
```

## API

| Member | Role |
| --- | --- |
| `list()` | Tracked read of all element values (structure + every item). |
| `list.peek()` | Untracked snapshot of values. |
| `list.set(values)` | Replace contents; **reuses** existing item nodes by index, creates/drops at the end. |
| `list.update(fn)` | `set(fn(peek()))`, returns new snapshot. |
| `list.length` | `Computed` of current length (tracks structural changes only). |
| `list.at(i)` | Item node at `i`; `undefined` if out of range. Only notifies when the node at `i` changes. Negative `i` counts from the end and is tracked separately from the positive index it currently resolves to (`-1` follows the last slot as length changes). |
| `list.nodes()` | Tracked `readonly` array of item nodes (identity changes on reorder/splice). |
| `push` / `pop` / `shift` / `unshift` / `splice` / `remove` / `clear` | Array-like mutations; each updates the node list signal. |

## `set()` vs wholesale leaf replace

`signalState` used to store arrays as a single leaf `signal`. `SignalArray` instead keeps stable
item nodes when you `set` a new array of the same length (or longer/shorter with reuse by index).
Effects that subscribed to `list.at(0)` stay bound to the same node object when index `0` is updated
in place.

Whole-array replacement from a parent branch still works: `tree.set({ tags: ['x', 'y'] })` calls
`tags.set(['x', 'y'])` on the collection.

## Limitations

- `DeepPartial` for a parent object does not express per-index patches; use `tags.at(i).set(...)` or
  collection mutators.
- The internal node list uses `equals: () => false` so referential identity of the `N[]` array
  always notifies on structural mutation (even if contents were reused).
- `makeItem` is required when constructing standalone `signalArray`; `signalState` supplies
  `(item) => signalState(item)`.
