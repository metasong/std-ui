# Validators

A validator is a plain function. It receives the node's raw value and returns the error(s), or
nothing when the value is valid:

```ts
type Validator<T> = (value: T) => ValidationError | readonly ValidationError[] | null | undefined | void;
interface ValidationError { kind: ValidityKind; message: string }
```

`kind` is restricted to the well-known names; use the `kinds` object for autocompletion:
`kinds.valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `tooShort`, `rangeUnderflow`,
`rangeOverflow`, `stepMismatch`, `badInput`, `customError` (the `ValidityState` flag names accepted
by `ElementInternals.setValidity()`).

Add validators to a node with `node.check.validators.set([...])`. They run reactively: whatever
signals a validator reads are tracked, and `errors` / `valid` / `allValid` / `allErrors` update when
the value or those signals change.

## Built-in validators

| Folder | Validators | `kind` |
| --- | --- | --- |
| [`required`](./required/README.md) | `required` | `valueMissing` |
| [`length`](./length/README.md) | `minLength`, `maxLength` | `tooShort`, `tooLong` |
| [`range`](./range/README.md) | `min`, `max` | `rangeUnderflow`, `rangeOverflow` |
| [`pattern`](./pattern/README.md) | `pattern`, `email` | `patternMismatch`, `typeMismatch` |
| [`manual`](./manual/README.md) | `manualValidator` | `customError` |
| [`async`](./async/README.md) | `asyncValidator` (pending state) | any |

Built-ins use the `ValidityState` flag names (as accepted by `ElementInternals.setValidity()`) for
`kind`, and treat empty values as valid so `required` stays the only rule about presence.

## Writing your own

### Inline

```ts
import { signalState, kinds, type Validator } from '../index.js';

const form = signalState({ name: 'Ada', a: 1, b: 2 });

const noSpaces: Validator<string> = (v) =>
	v.includes(' ') ? { kind: kinds.patternMismatch, message: 'No spaces allowed' } : null;
form.name.check.validators.set([noSpaces]);

// On an object node the validator sees the whole raw object, so it can compare fields.
form.check.validators.set([
	(v) => (v.a < v.b ? null : { kind: kinds.customError, message: 'a must be below b' }),
]);
```

- Return `null` / `undefined` / nothing when valid, one error, or an array for several.
- Pick a `kind` from `kinds`; use `kinds.customError` for rules of your own.
- Validators on an object or array see the whole raw subtree, so they can compare fields.

### As a reusable factory

Wrap the function in a factory so rules can take options and a custom message. Follow the built-ins
(see [`length/main.ts`](./length/main.ts)):

```ts
import { kinds } from '../../kinds.js';
import type { Validator } from '../../node.js';

/** Fails when a non-empty string does not start with `prefix`. */
export function startsWith<T extends string | null | undefined = string>(
	prefix: string,
	message = `Must start with ${prefix}`,
): Validator<T> {
	return (value) => (value && !value.startsWith(prefix) ? { kind: kinds.patternMismatch, message } : null);
}

// usage
const order = signalState({ code: '' });
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
