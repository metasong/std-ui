# Lazy `computed` recomputation

How `computed()` in [`./computed.ts`](./computed.ts) caches its last result and only re-runs the
derivation when marked **dirty**. See [`./signal.md`](./signal.md) for the full signals API.

`computed` stores the last result in `value` and only runs `fn` again when `dirty` is true. That
is lazy memoization: invalidate on dependency change, recompute on the next read.

## On read

If not dirty, the cached `value` is returned and `fn` is not called:

```ts
// computed.ts — computed read()
const read = (): T => {
	if (dirty) {
		value = runTracked(consumer, fn);
		dirty = false;
		hasValue = true;
	}
	track(dep);
	return hasValue ? value : (value as T);
};
```

## When a dependency changes

The computed is marked dirty and downstream subscribers are notified; there is no eager recompute.
This runs inside a `Watcher` (see [`./tracking.ts`](./tracking.ts)), whose `run()` unsubscribes
from every dependency the moment it fires - so further changes to *other* deps before the next
recompute re-subscribes via `runTracked` are silently ignored, with no manual `dirty` guard needed:

```ts
// computed.ts — the Watcher's notify callback
const consumer = new Watcher(() => {
	dirty = true;
	notify(dep);
});
```

## Summary

Repeated reads while clean return the same cached value without calling `fn` again. Writes to
dependencies only set `dirty = true`; the derivation runs the first time something reads the
computed after that (via `computed()` or `computed.peek()` — both call the same
`recomputeIfDirty` path; only a tracked `computed()` read registers the caller as a subscriber).

## Untracked read: `.peek()`

`computed.peek()` uses the same lazy recompute when `dirty`, but skips `track(dep)` so the active
consumer does not subscribe to this computed.
