// The reactive store backing a `@state()`/`@attribute()` field's value. Isolated from
// `./field-store.ts` so the "what holds the value" choice is a one-line swap, independent of
// accessor/field decorator mechanics - and shared by both decorators, since `@attribute()` is
// "everything `@state()` does, plus attribute sync" (see `./field-store.ts`).

import { buildSignalTree, type SignalTree } from '../signal/index.js';

/**
 * Picks the reactive store that backs a `@state()`/`@attribute()` field's value: `buildSignalTree()`
 * (see `../signal/tree.ts`) for *any* initial value, not just plain objects.
 *
 * For a primitive/array/class-instance/etc. initial value, `buildSignalTree()` already degrades to
 * a plain `signal()` internally - so a `number`/`string`/`boolean` field behaves exactly as
 * before, just reached through `SignalTree`'s identical `()`/`.peek()`/`.set()`/`.update()` surface.
 * For a *plain-object* initial value, it instead builds a tree of signals/computeds mirroring that
 * object's shape (see `../signal/tree.md`): each leaf becomes an independently-writable `Signal`,
 * and reading the field goes through the root `Computed`, which only recomputes (and so only
 * re-triggers `template()`/effects reading the whole property) when a leaf actually touched by that
 * write changes - assigning `this.config = { ...this.config, count: 1 }` doesn't spuriously dirty
 * sibling leaves the way replacing a single flat `signal()`'s value would force a full re-render on
 * identity change alone.
 *
 * Writing the field (`this.config = {...}`) calls the store's `.set()` with the *whole* new value;
 * `SignalTree.set()` treats its argument as a `DeepPartial` merge (recursing into branches, calling
 * `.set()` per provided leaf, leaving omitted keys untouched) - a complete object satisfies that
 * shape trivially (every key is provided), so this is a full logical replace, just performed
 * leaf-by-leaf so each `Signal.set()`'s own `Object.is` check still skips notifying leaves whose
 * value didn't actually change.
 */
export function createStore<V>(initial: V): SignalTree<V> {
	return buildSignalTree(initial);
}
