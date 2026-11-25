# `formUi` — touched, readonly, disabled as state

Form UI flags for state trees, next to `check` and `changes`. A plain `stateTree()` has none; `formUi(stateTree(...))`
(or `stateTree(...).with(formUi)`) adds `node.formUi` to the node and every descendant, including members added
later. It returns the same tree. Applying it twice is safe.

The state only **holds** the flags. [`formBind()`](../../../element/template/directives/form-bind/README.md)
shows them on the bound element.

```ts
import { stateTree } from '../index.js';
import { check, formUi } from '@std-ui/ext';

const form = stateTree({ account: { email: '', name: '' }, city: '' }).with(check).with(formUi);

form.account.formUi.disabled.own.set(true); // email and name are now disabled too
form.account.email.formUi.disabled.get();       // true  (an ancestor is disabled)
form.city.formUi.disabled.get();                // false
```

## Flags

Each of `touched`, `readonly` and `disabled` has the same shape:

- `flag.get()`: tracked, the **resolved** value (own flag combined with related nodes, see below).
- `flag.own`: this node's own flag, a writable `State<boolean>`.

| Flag | `flag.get()` is true when | Direction |
| --- | --- | --- |
| `readonly` | the node **or any ancestor** is readonly | down: a parent locks its members |
| `disabled` | the node **or any ancestor** is disabled | down |
| `touched` | the node **or any descendant** is touched | up: a group is touched once a member is |

A node adopted into several trees has several parents: it is readonly / disabled when any of them is.

## Methods

| Member | Role |
| --- | --- |
| `touch()` / `untouch()` | Set / clear this node's `touched.own`. A touched descendant still makes `touched.get()` true. |
| `touchAll()` / `untouchAll()` | Same for the node and every descendant, e.g. on submit and on reset. |

```ts
form.formUi.touchAll();           // submit: every bound control shows its errors
form.account.formUi.touched.get();    // true
form.formUi.untouchAll();         // reset
```

## Notes

- Not part of the data: `deep()`, `check` and `changes` never see `formUi`.
- **Parent links** for the cascade are learned when `formUi` is applied. A node with no known parent
  (e.g. a member added later) triggers a re-scan from the roots; that re-scan also drops links to removed
  members. Until then a removed member can keep an old cascade alive.
- `formUi` does not reset itself with `changes.reset()`; call `untouchAll()` yourself.
