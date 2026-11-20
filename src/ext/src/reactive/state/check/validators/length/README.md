# `minLength` / `maxLength`

Length limits for strings and arrays.

| Validator | `flag` | Fails when |
| --- | --- | --- |
| `minLength(n, message?)` | `tooShort` | a non-empty value is shorter than `n` |
| `maxLength(n, message?)` | `tooLong` | a value is longer than `n` |

```ts
form.pw.check.validators.set([required(), minLength(8), maxLength(64)]);
```

Empty (`''`, `[]`) and nullish values pass; add `required` to reject them.

The `flag` values are the `ValidityState` flag names, as accepted by `ElementInternals.setValidity()`.
