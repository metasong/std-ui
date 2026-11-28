# Signal object (`stateObject`)

Observable reactive records for the signal tree, the object counterpart of
[`../array`](../array/README.md). Each property is its own member node (typically from
`store()`), while a separate internal signal tracks **which members exist**.

Implementation details: [`design.md`](./design.md).

| Read | Returns | Re-runs on |
| --- | --- | --- |
| `obj.get()` | plain value | replacement only: `set()` adding a key, clear, or restore |
| `obj.shallow()` | plain value | + `delete(key)` |
| `obj.deep()` | plain value | + any member's value change, recursively |
| `obj.key` | member node | never (untracked) |

## Via `store()`

Any plain object on the initial value becomes a `StateObject` automatically:

```ts
import { store } from '../main.js';

const user = store({ label: 'Ada', age: 30 });
user.label.set('Grace');      // only `label` notifies
user.deep();                  // { label: 'Grace', age: 30 }
user.set({ zip: '1000' });    // adds member `zip`
user.delete('zip');           // removes it
user.get();                       // { label: 'Grace', age: 30 } (tracks replacement only)
```

## API

| Member | Role |
| --- | --- |
| `obj.get()` | Plain value; notifies only when the member record is replaced. |
| `obj.shallow()` | Plain value; notifies on any membership change. |
| `obj.deep()` | Tracked plain value (every member, recursively). |
| `obj.peek()` | Untracked deep snapshot. |
| `obj.set(partial)` | Patch existing members, add unknown keys; `set(undefined \| null)` clears. |
| `obj.update(fn)` | `set(fn(peek()))`, returns the new snapshot. |
| `obj.delete(key)` | Remove a member; returns whether anything was removed. |
| `obj.key` | Untracked member node. API names win over same-named members. |
| `obj._.key` | Untracked member node from a members-only view with no API names. Use it when a key collides with the API (`obj._.check`); a member named `_` is `obj._._`. |
| `obj.check.validators` / `errors.get()` / `errors.all.get()` / `valid.get()` | Validation, see [`../README.md`](../README.md#validation). These names are reserved like `set` / `delete`. |
| `obj.changes.dirty.get()` / `reset(next?)` | Change tracking against the initial value, see [`../README.md`](../README.md#change-tracking-dirty-and-reset). `changes` is a reserved name. |

## Limitations

- Patching existing members does **not** replace the record, so `obj.get()` does not re-run for value
  changes; read `deep()` (or the member) for those.
- Members added at runtime are not part of the static type.
