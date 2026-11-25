# Manual validator (`manualValidator`)

A validator whose errors are pushed from outside (e.g. an API response) instead of computed from a
rule. It is a normal `Validator`, so add it to `node.check.validators` like any other; create as many
as you need, each keeps its own errors.

```ts
import { stateTree, manualValidator } from '../../index.js';

const form = stateTree({ email: 'a@b.c' });
const server = manualValidator<string>();
form.email.check.validators.set([server]);

server.set('Email taken');       // replaces its earlier errors
form.email.check.errors.get();       // [{ flag: 'customError', message: 'Email taken' }]
server.clear();                  // removes them
```

| Member | Effect |
| --- | --- |
| `set(error \| errors)` | Replaces this validator's errors; an empty list clears them. Each item is a message or `{ flag, message }` |
| `clear()` | Removes this validator's errors |

A plain message gets `flag: flags.customError`. To choose the flag, pass an error object, alone or
mixed with messages in a list:

```ts
server.set({ flag: flags.tooLong, message: 'Max 50 characters' });
server.set(['Try again', { flag: flags.badInput, message: 'Not a valid email' }]);
```

`flag` is limited to the well-known `flags` (the `ValidityState` flag names); free-form strings do
not compile.

## Expiry

Errors apply to the node's value at the time of `set` and drop as soon as it changes. They stay
dropped even if the value later returns to the old one; call `set` again to re-apply.

The validator does not know its node, so it records the value on its first run after `set`
(normally the same moment). Setting errors on a validator not yet attached to a node ties them to
the value the node holds when it first runs.

Note that `check.validators.set([...])` replaces the whole list, so keep the validator and include
it again if you reset the list.
