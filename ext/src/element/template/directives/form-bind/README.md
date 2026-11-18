# `formBind()` — `bind()` plus form UI

`formBind` is [`bind()`](../../../../../../core/src/element/template/directives/bind/README.md) with the same
arguments and the same two-way value sync, plus an element-side layer for form controls. Plain `bind()` only
syncs values; use `formBind()` wherever the state has [`check`](../../../../reactive/state/check/design.md) or
[`formUi`](../../../reactive/state/form-ui/README.md).

```ts
const form = state({ name: '', age: 5 }).with(check).with(formUi);

t`<input .value=${formBind(form.name)} />
  <input type="number" .value=${formBind(form.age)} />`;

form.name.formUi.disabled.own.set(true); // the first input is disabled
form.formUi.touchAll();                  // every input shows its errors
```

## What it adds

All of it is optional and read from the bound state structurally: a state without `check` or `formUi` just
gets the value sync, and `bind({ get, set })` accessors get no form UI at all.

| Source | On the element |
| --- | --- |
| `check.errors()` | Constraint validation: `setCustomValidity` on native `<input>`, `<select>`, `<textarea>`; `setErrors(property, errors)` on a `FormElement` (flags merged across its bound properties). Cleared when the state is valid or the binding goes away. |
| `focusout` / `invalid` | Sets `formUi.touched.own` (or marks the element directly when the state has no `formUi`). |
| `formUi.touched()` | `:state(touched)` on custom elements with `ElementInternals`, otherwise the `[touched]` attribute. Style errors only after that: `:state(touched):invalid`, `[touched]:invalid`. |
| `formUi.readonly()` | `readOnly` on `<input>` / `<textarea>`, otherwise the `readonly` attribute; plus `aria-readonly`. |
| `formUi.disabled()` | `disabled` on native controls and buttons, otherwise the `disabled` attribute; plus `aria-disabled`. |

`readonly` and `disabled` are the **resolved** values, so a parent's flag applies to every bound control below
it. While the resolved flag stays false the directive writes nothing, and on disconnect it only undoes what it applied itself.

`touched` is likewise the resolved read: a bound **parent** node shows `[touched]` as soon as any member is
touched. To follow only the node's own flag, build your own plugin (below).

## Composition

`formBind` is `createBind([formUiPlugin])` from core: the value-sync directive plus one element plugin. Both
are exported, so you can combine the form UI with your own plugins:

```ts
import { createBind } from '@std-ui/core';
import { formUiPlugin } from '@std-ui/ext';

const myBind = createBind([formUiPlugin, ({ element, source }) => { /* ... */ return () => { /* dispose */ }; }]);
```

A plugin runs once per bound element and is disposed when the element changes or the directive disconnects.
`source()` returns the latest first argument of the directive call.

## Files

| File | Owns |
| --- | --- |
| [`main.ts`](./main.ts) | The plugin (errors, touched, readonly / disabled wiring), `formUiPlugin`, `formBind`. |
| [`../../../element/form/touched.ts`](../../../form/touched.ts) | The touched marker (`markTouched` / `unmarkTouched`) and the `focusout` / `invalid` listener helper. |
| [`form-bind.test.ts`](./form-bind.test.ts) | Tests through `t()` / `render()`. |
