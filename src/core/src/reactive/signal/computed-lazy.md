# Lazy `computed` recomputation and equality cutoff

How `computed()` in [`./computed.ts`](./computed.ts) caches its last result, only re-runs the
derivation when needed, and stops propagation when the result is unchanged. See
[`./state.md`](./state.md) for the full signals API.

## The graph model

Every `signal`, `computed`, and `effect` is a `ReactiveNode` (see [`./tracking.ts`](./tracking.ts)):

```
version    bumped only when my value really changes (per `equals`)
sources    what I read -> the version I saw when I read it
observers  who reads me
```

This is the push-pull model of the [TC39 Signals proposal](https://github.com/tc39/proposal-signals),
also used by Angular and Preact signals.

## Push: a dependency changes

A write bumps the signal's `version` and calls `markDirty()` on its observers. A computed only
propagates on the clean -> dirty edge; nothing is recomputed yet:

```ts
// computed.ts
node.markDirty = () => {
	if (node.dirty) return;
	node.dirty = true;
	notify(node);
};
```

"Dirty" therefore means **maybe** stale.

## Pull: on read

`refresh()` runs on every read. If clean, the cached value is returned. If dirty, it first asks
`sourcesChanged()` — refresh each source in read order and compare its `version` with the one seen —
and only runs `fn` if something actually moved:

```ts
// computed.ts
node.refresh = () => {
	if (!node.dirty) return;
	if (!hasValue || sourcesChanged(node)) {
		const next = runTracked(node, fn);
		if (!hasValue || !equals(next, value)) {
			value = next;
			node.version++;
		}
		hasValue = true;
	}
	node.dirty = false;
};
```

## Equality cutoff

If the recompute yields a value `equals()` to the cached one, the old value **and `version`** are
kept. Observers then see an unchanged version in their own pull check and skip work too:

```ts
const n = state(1);
const parity = computed(() => n.get() % 2);
effect(() => console.log(parity()));
n.set(3); // parity recomputes to 1 again -> effect does NOT re-run
```

Effects do the same pull check before re-running (see [`../effect/effect.ts`](../effect/effect.ts)).

## Untracked read: `.peek()`

`computed.peek()` uses the same `refresh()`, but skips `track(node)` so the active consumer does
not subscribe to this computed.
