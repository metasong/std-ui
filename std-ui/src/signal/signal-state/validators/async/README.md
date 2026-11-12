# Async validator (`asyncValidator`)

A validator whose result comes from an async check, e.g. a server round trip. It is a normal
`Validator`, so add it to `node.check.validators` like any other.

```ts
const unique = asyncValidator<string>(
	async (email, { signal }) => {
		const taken = await api.emailTaken(email, { signal });
		return taken ? { kind: 'customError', message: 'Email taken' } : null;
	},
	{ debounce: 300 },
);
form.email.check.validators.set([required(), email(), unique]);

unique.pending();            // this validator: true while its check is outstanding
form.email.check.pending();  // the node: true when any of its validators is pending
form.email.check.valid();    // false while pending
```

`unique.pending()` is tracked, so it works in effects and templates. It reports on the value the node
last asked the validator to check: it is `false` until the node has read the validator once, and it
follows a value change one microtask later. `node.check.pending` updates immediately and is the one
to use for gating submit.

The check returns an error, an array of errors, or nothing, like any validator, and may use any
`kind`.

## Pending state

While the result for the node's current value is unknown:

| Member | Value |
| --- | --- |
| `check.pending` | `true` when any of the node's own validators is pending |
| `check.allPending` | `true` when the node or any descendant is pending |
| `check.valid` / `check.allValid` | `false` (a form is not submittable mid-request) |
| `check.errors` | the async validator reports nothing yet |

Any validator can take part by exposing `pending(value)`; `asyncValidator` does.

## Behavior

- The check runs once per value, `debounce` ms (default `0`) after the value last changed.
- A newer value aborts the previous check through `signal`; late results for old values are ignored.
- Only the latest value is cached: going back to an earlier value checks it again.
- A thrown / rejected check yields one `customError` "Validation failed", or whatever `onError(e)` returns.
- The check starts when something reads the node's `errors`, `valid` or `pending` (computeds are
  lazy); a node nobody reads is never validated.
