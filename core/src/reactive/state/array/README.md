# Signal array (`signalArray`)

Observable reactive collections for the signal tree. Each array element is its own node (typically
from `state()`), while a separate internal signal tracks **which nodes exist and in what
order**. That split gives three tracking depths, plus per-slot access:

| Read | Returns | Re-runs on |
| --- | --- | --- |
| `list()` | plain values | whole replacement via `set()` / `update()` only (like a plain `signal(array)`) |
| `list.shallow()` | plain values | + `push` / `pop` / `splice` / reorder |
| `list.deep()` | plain values | + any item's value change, recursively |
| `list.at(i)` | node | the node at `i` being swapped |
| `list[i]` | node | never (untracked) |

Implementation details: [`design.md`](./design.md).

## Standalone usage

```ts
import { signal } from '../../signal/index.js';
import { effect } from '../../effect/index.js';
import { signalArray } from './index.js';

const list = signalArray([1, 2, 3], (n) => signal(n));

effect(() => console.log(list.deep())); // [1, 2, 3]
list.at(0)!.set(10);                    // only index-0 effects + deep() readers
list.push(4);                           // shallow() / deep() / length readers, not list()
```

## Via `state()`

Any array on the initial value becomes a `SignalArray` automatically:

```ts
import { state } from '../main.js';

const root = state({ tags: ['a', 'b'] });
root.tags.push('c');
root.tags.at(0)!.set('z');
root(); // { tags: ['z', 'b', 'c'] }
```

Nested object elements are full `SignalState` branches:

```ts
const todos = state([{ text: 'buy milk', done: false }]);
todos.at(0)!.done.set(true);
todos.at(0)!(); // { text: 'buy milk', done: true }
```

## In a `UIElement` with `@state()`

[`@state()`](../../../element/decorators/state/README.md) calls `state()` on the field’s initial value. Any array on that tree —
top-level field or property on a plain-object field — is a `SignalArray`: `child.deep()` for a tracked value snapshot,
`child.push(...)` / `child.at(i)!.set(...)` for structure and per-slot writes.

```ts
import { tag, state, UIElement } from '../../../index.js';
import { t } from '../../../element/template/index.js';

type Todo = { text: string; done: boolean };

@tag('tag-todo-panel')
class TagTodoPanel extends UIElement {
	@state() model = {
		tags: ['work', 'home'],
		todos: [
			{ text: 'buy milk', done: false },
			{ text: 'walk dog', done: true },
		] as Todo[],
	};

	protected override template() {
		return t`
			<ul class="tags">
				${this.model.tags.deep().map((label) => t`<li>${label}</li>`)}
			</ul>
			<button type="button" @click=${() => this.model.tags.push('errands')}>add tag</button>

			<ul class="todos">
				${this.model.todos.deep().map((todo, i) => t`
					<li>
						<input
							type="checkbox"
							.checked=${todo.done}
							@change=${() => this.model.todos.at(i)!.done.set(!this.model.todos.at(i)!.done())}
						/>
						${todo.text}
					</li>
				`)}
			</ul>
		`;
	}
}
```

On a plain-object `@state()` field, each array property is still a `SignalArray`: `this.model.tags.push(...)` /
`this.model.todos.at(i)!.done.set(...)`. Toggling `done` updates only that row’s branch; you do not need
`this.model.todos.set(this.model.todos.deep().map(...))` for in-place field edits. Whole-list replace still works:
`this.model.todos.set([...])`.

For lists that reorder or splice in the middle, pair `@state()` with keyed rendering — see
[`mapByKey`](../../../element/template/directives/map-by-key/README.md).

## API

| Member | Role |
| --- | --- |
| `list()` | Plain values; notifies only on whole replacement (`set` / `update`). |
| `list.shallow()` | Plain values; notifies on any structural change (replace, push, splice, reorder). |
| `list.deep()` | Tracked plain values (structure + every item, recursively). |
| `list[i]` | Untracked node at non-negative integer `i`. |
| `list.peek()` | Untracked snapshot of values. |
| `list.set(values)` | Replace contents; **reuses** existing item nodes by index, creates/drops at the end. |
| `list.update(fn)` | `set(fn(peek()))`, returns new snapshot. |
| `list.length` | `Computed` of current length (tracks structural changes only). |
| `list.at(i)` | Item node at `i`; `undefined` if out of range. Only notifies when the node at `i` changes. Negative `i` counts from the end and is tracked separately from the positive index it currently resolves to (`-1` follows the last slot as length changes). |
| `list.check.validators` / `errors()` / `errors.all()` / `valid()` | Validation, see [`../README.md`](../README.md#validation). Validators receive the raw values array; `errors.all()` paths use item indices. |
| `list.changes.dirty()` / `reset(next?)` | Change tracking against the initial values, see [`../README.md`](../README.md#change-tracking-dirty-and-reset). |
| `push` / `pop` / `shift` / `unshift` / `splice` / `remove` / `clear` | Array-like mutations, in place on the node array; notify `shallow()` / `deep()` / `length` / `at`, not `list()`. |

## `set()` vs wholesale leaf replace

`state` used to store arrays as a single leaf `signal`. `SignalArray` instead keeps stable
item nodes when you `set` a new array of the same length (or longer/shorter with reuse by index).
Effects that subscribed to `list.at(0)` stay bound to the same node object when index `0` is updated
in place.

Whole-array replacement from a parent branch still works: `tree.set({ tags: ['x', 'y'] })` calls
`tags.set(['x', 'y'])` on the collection.

## Limitations

- `DeepPartial` for a parent object does not express per-index patches; use `tags.at(i).set(...)` or
  collection mutators.
- The internal node list uses `equals: () => false` so in-place structural mutation of the `N[]`
  array always notifies `shallow()`; `list()` subscribes to a computed over it whose `Object.is`
  cutoff only passes a new array instance (from `set()`).
- `list()` and `shallow()` return the cached `deep()` value without subscribing to the items, so a
  value read through them can be newer than the last change they notified on.
- `makeItem` is required when constructing standalone `signalArray`; `state` supplies
  `(item) => state(item)`.
