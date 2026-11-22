# Signal object — internal design

How `stateObject()` in [`main.ts`](./main.ts) is implemented. For usage, see [`README.md`](./README.md).

## Data model

1. **`members: State<Record<string, N>>`** — the member nodes by key, with `equals: () => false`.
   `delete` edits the record **in place** and then `members.set(sameRecord)`; a membership change
   from `set()` (new key, clear, restore) swaps in a **new** record.
2. **`()`** — `computed(() => members())`. In-place edits recompute to the same instance and are
   cut off by `Object.is`; only a new record gets through.
3. **`shallow()`** — reads `members()` directly: every membership change.
4. **`deep()`** — `computed` building `{ [key]: readValue(member) }`, or the empty value when cleared.
5. **`empty`** — `false`, or `{ value: undefined | null }` after `set(undefined | null)`. A plain
   variable is enough: every change to it is paired with a new `members` record, which notifies.

## `set(partial)`

- `undefined` / `null` → set `empty`, swap in a copied record (no-op if already that empty value).
- object → if cleared, un-clear and swap in a copied record; for each entry, an existing member
  gets `member.set(value)`, an unknown key gets `makeMember(value)` in a copied record.
- Only swap the record when membership changed, so a patch of existing members notifies just those
  members and untouched siblings keep their `deep()` identity.

## Member access

A `Proxy` `get` / `has` trap returns `members.peek()[key]` (untracked) when `key` is an own member
and not an API name (`set`, `update`, `peek`, `deep`, `shallow`, `delete`).
