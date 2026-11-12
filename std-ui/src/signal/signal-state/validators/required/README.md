# `required`

`required(message?)` fails (`kind: 'valueMissing'`) for `null`, `undefined`, `''` and `[]`. Values
like `0`, `false` and `' '` count as filled.

```ts
form.name.check.validators.set([required('Name needed')]);
```

The other validators here treat empty values as valid, so combine them with `required` when a value
is mandatory.

The `kind` values are the `ValidityState` flag names, as accepted by `ElementInternals.setValidity()`.
