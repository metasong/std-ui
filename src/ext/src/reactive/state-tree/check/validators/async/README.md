# Async validator (`asyncValidator`)

A validator whose result comes from an async check, e.g. a server round trip. It is a normal
`Validator`, so add it to `node.check.validators` like any other.

```ts
const unique = asyncValidator<string>(
	async (email, { abortSignal }) => {
		const taken = await api.emailTaken(email, { abortSignal });
		return taken ? { flag: flags.customError, message: 'Email taken' } : null;
	},
	{ debounce: 300 },
);
form.email.check.validators.set([required(), email(), unique]);

unique.pending();            // this validator: true while its check is outstanding
form.email.check.pending.own();  // the node: true when any of its validators is pending
form.email.check.valid.own();    // false while pending
```

`unique.pending()` is tracked, so it works in effects and templates. It reports on the value the node
last asked the validator to check: it is `false` until the node has read the validator once, and it
follows a value change one microtask later. `node.check.pending.own` updates immediately and is the one
to use for gating submit.

The check returns an error, an array of errors, or nothing, like any validator. Its `flag` is one of
the [`flags`](../../flags.ts).

## Cancellation (`abortSignal`)

The second argument's `abortSignal` is a standard [`AbortSignal`](https://developer.mozilla.org/docs/Web/API/AbortSignal)
(unrelated to this library's reactive `state()`). It is aborted as soon as the check is superseded:

- the node's value (or the `deps` result) changed, so the result would be for stale input, or
- a newer check replaced it while it was still running.

Pass it to whatever you call so the request is really cancelled instead of just ignored:

```ts
async (email, { abortSignal }) => {
	const res = await fetch(`/api/email-taken?e=${encodeURIComponent(email)}`, { abortSignal });
	return (await res.json()).taken ? { flag: flags.customError, message: 'Email taken' } : null;
}
```

- Using it is optional. If you ignore it, the check still runs to the end, but its result is
  discarded when it is stale.
- An aborted `fetch` rejects with an `AbortError`. You do not need to catch it: the validator drops
  rejections of aborted checks and does not call `onError` for them.
- To stop work yourself, read `abortSignal.aborted` or listen for `abortSignal.addEventListener('abort', ...)`.
- A check that is still waiting out its `debounce` has not started, so there is nothing to abort; it
  is just rescheduled.

## Pending state

While the result for the node's current value is unknown:

| Member | Value |
| --- | --- |
| `check.pending.own` | `true` when any of the node's own validators is pending |
| `check.pending` | `true` when the node or any descendant is pending |
| `check.valid` / `check.valid` | `false` (a form is not submittable mid-request) |
| `check.errors` | the async validator reports nothing yet |

Any validator can take part by exposing `pending(value)`; `asyncValidator` does.

## Depending on other signals (`deps`)

The `check` callback runs asynchronously (after the debounce, and after any `await`), outside any
tracking context. A signal read inside `check` is therefore **not tracked**: when it changes,
nothing re-runs. List such signals in `deps` instead:

```ts
const country = state('NL');

const vat = asyncValidator<string, string>(
	async (number, { abortSignal, deps: countryCode }) => {
		const ok = await api.vatValid(number, countryCode, { abortSignal });
		return ok ? null : { flag: flags.customError, message: 'Invalid VAT number' };
	},
	{ deps: () => country() },
);
form.vat.check.validators.set([vat]);

country.set('BE'); // `deps` re-runs, so the check runs again for the same number
```

- `deps` is read inside the node's computed, like a sync validator, so every signal it reads is tracked.
- Its result is passed to `check` as `ctx.deps`. Use that snapshot rather than reading the signals
  again inside `check`.
- The cache key is the node's value plus the `deps` result (compared deeply), so the check re-runs
  when either changes. While it runs the node is pending, as for a value change.
- Return a plain value or an object from `deps`; return several inputs together with
  `() => ({ country: country(), vatId: vatId() })`.

## Behavior

- The check runs once per value and `deps` result, `debounce` ms (default `0`) after the value last changed.
- A newer value (or `deps` result) aborts the previous check through `abortSignal`; late results for old values are ignored.
- Only the latest value is cached: going back to an earlier value checks it again.
- A thrown / rejected check yields one `customError` "Validation failed", or whatever `onError(e)` returns.
- The check starts when something reads the node's `errors`, `valid` or `pending` (computeds are
  lazy); a node nobody reads is never validated.
