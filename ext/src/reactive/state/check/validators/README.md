# Validators

A validator is a plain function. It receives the node's raw value and returns the error(s), or
nothing when the value is valid:

```ts
type Validator<T> = (value: T) => ValidationError | readonly ValidationError[] | null | undefined | void;
interface ValidationError { flag: ValidityFlag; message: string }
```

`flag` is restricted to the well-known names; use the `flags` object for autocompletion:
`flags.valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `tooShort`, `rangeUnderflow`,
`rangeOverflow`, `stepMismatch`, `badInput`, `customError` (the `ValidityState` flag names accepted
by `ElementInternals.setValidity()`).

Add validators to a node with `node.check.validators.set([...])`. They run reactively: whatever
signals a validator reads are tracked, and `errors` / `errors.all` / `valid` / `valid.own` update when
the value or those signals change.

How validators are tracked (and why async checks are not): [`design.md`](./design.md).

## Built-in validators

| Folder | Validators | `flag` |
| --- | --- | --- |
| [`required`](./required/README.md) | `required` | `valueMissing` |
| [`length`](./length/README.md) | `minLength`, `maxLength` | `tooShort`, `tooLong` |
| [`range`](./range/README.md) | `min`, `max` | `rangeUnderflow`, `rangeOverflow` |
| [`pattern`](./pattern/README.md) | `pattern`, `email` | `patternMismatch`, `typeMismatch` |
| [`manual`](./manual/README.md) | `manualValidator` | `customError` |
| [`async`](./async/README.md) | `asyncValidator` (pending state, `deps`) | any |
| [`when`](./when/README.md) | `when` (conditional wrapper) | none |

## Enabling conditionally

`when(enabled, validator | validators[])` applies validators only while `enabled()` (a signal,
computed or `() => boolean`) is true. Disabled means no errors, not pending, and the validator is
not called (an async one starts no request). `null` means always enabled. The `flag` tag is not
kept, since the constraint is conditional.

```ts
form.vat.check.validators.set([required(), when(isCompany, [minLength(8), pattern(/^[A-Z]{2}/)])]);
```

To switch off a whole node's own validation, set `node.check.enabled.set(false)` (default `true`);
then `valid.own` is true and `errors` is empty. Descendants keep their own `enabled`.

With `formUi` on the tree, a node whose `formUi.disabled()` is true (own or inherited from an
ancestor) is treated the same way, like a native disabled control.

## Rules for many members: `eachValidators` and `fields`

`container.check.eachValidators.set([...])` gives the same validators to every member of an array
or of a record-like object (all values one type), existing and added later. Each member reports
them on its own `check` (so a bound input shows them), and the container's `valid` / `errors.all`
include them with the index or key as the path. A member's own `validators` still work and run after.

```ts
form.tags.check.eachValidators.set([required(), minLength(3)]);
form.tags.push(''); // invalid right away; form.tags.check.errors.all() ? [{ path: [1], ... }]
```

`object.check.fields({...})` sets validators per member key in one call, also for members added
later. A new call replaces the previous one; members' own `validators` are kept.

```ts
form.check.fields({
	name: [required(), minLength(3)],
	age: [min(18)],
});
```

Built-ins use the `ValidityState` flag names (as accepted by `ElementInternals.setValidity()`) for
`flag`, and treat empty values as valid so `required` stays the only rule about presence.

## Writing your own

### Inline

```ts
import { state, flags, type Validator } from '../index.js';

const form = state({ name: 'Ada', a: 1, b: 2 });

const noSpaces: Validator<string> = (v) =>
	v.includes(' ') ? { flag: flags.patternMismatch, message: 'No spaces allowed' } : null;
form.name.check.validators.set([noSpaces]);

// On an object node the validator sees the whole raw object, so it can compare fields.
form.check.validators.set([
	(v) => (v.a < v.b ? null : { flag: flags.customError, message: 'a must be below b' }),
]);
```

- Return `null` / `undefined` / nothing when valid, one error, or an array for several.
- Pick a `flag` from `flags`; use `flags.customError` for rules of your own.
- Validators on an object or array see the whole raw subtree, so they can compare fields.

### As a reusable factory

Wrap the function in a factory so rules can take options and a custom message. Follow the built-ins
(see [`length/main.ts`](./length/main.ts)):

```ts
import { flags } from '../../flags.js';
import type { Validator } from '../../main.js';

/** Fails when a non-empty string does not start with `prefix`. */
export function startsWith<T extends string | null | undefined = string>(
	prefix: string,
	message = `Must start with ${prefix}`,
): Validator<T> {
	return (value) => (value && !value.startsWith(prefix) ? { flag: flags.patternMismatch, message } : null);
}

// usage
const order = state({ code: '' });
order.code.check.validators.set([required(), startsWith('AB-')]);
```

Conventions:

- Skip empty / nullish values (`if (!value) return null`) and leave presence to `required`.
- Keep it pure: same value in, same errors out. Do not mutate the value.
- Reactive inputs are fine: read another signal inside the function and the errors follow it.

### Stateful validators

When errors come from outside rather than from the value (e.g. an API response), use
[`manualValidator`](./manual/README.md). The same pattern works for your own: a validator may be a
function with extra methods attached, as long as it reads a signal inside so changes re-run it.

### Adding one to this folder

1. Create `validators/<name>/` with `main.ts`, `index.ts` (re-export), `<name>.test.ts` and `README.md`.
2. Export it from [`index.ts`](./index.ts) and from `../index.ts`.
