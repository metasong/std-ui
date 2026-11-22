# `min` / `max`

Inclusive numeric bounds.

| Validator | `flag` | Fails when |
| --- | --- | --- |
| `min(n, message?)` | `rangeUnderflow` | the number is below `n` |
| `max(n, message?)` | `rangeOverflow` | the number is above `n` |

```ts
form.age.check.validators.set([min(0), max(120)]);
```

`null` / `undefined` pass; add `required` to reject them.

The `flag` values are the `ValidityState` flag names, as accepted by `ElementInternals.setValidity()`.
