# `when`

Runs validators only while a condition is true.

```ts
import { when, required, minLength } from '@std-ui/ext';

form.vat.check.validators.set([
	required(),
	when(isCompany, minLength(8)), // isCompany: Signal<boolean> | Computed<boolean> | () => boolean
]);

when(isCompany, [minLength(8), pattern(/^[A-Z]{2}/)]); // one condition for several validators
when(null, minLength(8)); // null: always enabled, returns the validator unchanged
```

| `enabled()` | Result |
| --- | --- |
| `true` | Same as the wrapped validator(s); errors are concatenated, `pending` is forwarded |
| `false` | No errors, not pending, wrapped validators are not called (an async one starts no request) |

- `enabled` is read inside the node's computeds, so changing it updates `errors`, `valid` and `pending`.
- The `flag` tag of `required()` etc. is not kept: the constraint is conditional.
- To disable all of a node's own validators at once, use `node.check.enabled.set(false)` instead.
