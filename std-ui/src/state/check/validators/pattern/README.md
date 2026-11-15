# `pattern` / `email`

| Validator | `flag` | Fails when |
| --- | --- | --- |
| `pattern(regex, message?)` | `patternMismatch` | a non-empty string does not match `regex` |
| `email(message?)` | `typeMismatch` | a non-empty string is not shaped like `a@b.c` (not full RFC validation) |

```ts
form.zip.check.validators.set([pattern(/^\d{4}$/, '4 digits')]);
form.mail.check.validators.set([required(), email()]);
```

Empty and nullish values pass; add `required` to reject them. `lastIndex` is reset before each
test, so `g` / `y` regexes are safe.

The `flag` values are the `ValidityState` flag names, as accepted by `ElementInternals.setValidity()`.
