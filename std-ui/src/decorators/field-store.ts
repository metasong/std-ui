// Shared field decorator mechanics for turning a class field into a read-only store accessor.
// Both `@state()` (`./state/state.decorator.ts`, store only) and `@attribute()`
// (`./attribute/attribute.decorator.ts`, store + attribute sync) delegate here instead of
// duplicating it - `@attribute()` is "everything `@state()` does, plus attribute
// registration/sync", so this is the one piece of logic they share.
//
// Plain fields only (no `accessor`) - see `./design.md` for why.

import { signalState, type SignalState } from '../signal/index.js';

/**
 * Picks the reactive store that backs a `@state()`/`@attribute()` field's value: `signalState()`
 * (see `../signal/signal-state/main.ts`) for *any* initial value, not just plain objects.
 *
 * For a primitive/array/class-instance/etc. initial value, `signalState()` already degrades to
 * a plain `signal()` internally - so a `number`/`string`/`boolean` field behaves exactly as
 * before, just reached through `SignalState`'s identical `()`/`.peek()`/`.set()`/`.update()` surface.
 * For a *plain-object* initial value, it instead builds a tree of signals/computeds mirroring that
 * object's shape (see `../signal/signal-state/README.md`): each leaf becomes an independently-writable `Signal`,
 * and reading the field goes through the root `Computed`, which only recomputes (and so only
 * re-triggers `template()`/effects reading the whole property) when a leaf actually touched by that
 * write changes - `this.config.set({ ...this.config.peek(), count: 1 })` doesn't spuriously dirty
 * sibling leaves the way replacing a single flat `signal()`'s value would force a full re-render on
 * identity change alone.
 *
 * Writing the field (`this.config.set({...})`) calls the store's `.set()` with the *whole* new value;
 * `SignalState.set()` treats its argument as a `DeepPartial` merge (recursing into branches, calling
 * `.set()` per provided leaf, leaving omitted keys untouched) - a complete object satisfies that
 * shape trivially (every key is provided), so this is a full logical replace, just performed
 * leaf-by-leaf so each `Signal.set()`'s own `Object.is` check still skips notifying leaves whose
 * value didn't actually change.
 */
function createStore<V>(initial: V): SignalState<V> {
	return signalState(initial);
}

// `@state()` and `@attribute()` aren't meant to be stacked on the same field, but rather than
// throwing if they are, `applyFieldStore()` stays compatible: it tracks which fields it has
// already wired (per class, via `context.metadata` - shared across every decorator on the class,
// same mechanism `./attribute/metadata.ts` uses) and, if the *other* decorator already wired this exact
// field, treats itself as a no-op for storage purposes - see `applyFieldStore()` below.
const wiredFieldsKey = Symbol('wiredSignalBackedFields');
type WiredFieldsMetadata = Record<symbol, Set<PropertyKey> | undefined>;

function wiredFields(meta: object): Set<PropertyKey> {
	const typed = meta as WiredFieldsMetadata;
	if (Object.prototype.hasOwnProperty.call(typed, wiredFieldsKey)) {
		return typed[wiredFieldsKey]!;
	}
	return (typed[wiredFieldsKey] = new Set());
}

/**
 * Applies read-only store-backed field wiring to a decorated plain field - the entire body of what
 * used to be `@property()`, minus any attribute concern. `onInitialValue`, if given, runs once per
 * instance with the field's initial value, right as its store is created - `@attribute()` uses
 * this to resolve a type-inferred converter once that value is known (see
 * `./attribute/attribute.decorator.ts`); `@state()` doesn't need it.
 *
 * The field's own initializer runs untouched (`this.key = initialValue`, an ordinary own data
 * property), and `context.addInitializer` - which runs with `this` bound to the instance,
 * immediately *after* that field is set - replaces that *same* own property with a store-backed
 * accessor via `Object.defineProperty`, before the constructor can run any later code. A plain
 * field can't delegate through a prototype `get`/`set`: class field initializers always use
 * `[[DefineOwnProperty]]` straight onto the instance, bypassing any inherited/decorator-installed
 * accessor - redefining the instance's own property, right after it's created, avoids this.
 *
 * Stacking `@state()` and `@attribute()` on the same field: decorators on one class element apply
 * bottom-up (the one closest to the field runs first). Whichever of the two runs first wins - it
 * does the real wiring and marks the field as wired in `context.metadata`. The second one to run
 * sees that mark and skips wiring entirely (no second store, no double `Object.defineProperty`) -
 * it only still forwards the resolved initial value to its own `onInitialValue` if given, since the
 * field's own property already resolves through the winning store by then. `@attribute()` always
 * registers its `AttributeDef` regardless of which one wins (see
 * `./attribute/attribute.decorator.ts`), so attribute parsing/reflection keeps working through
 * whichever store ends up backing the field.
 */
export function applyFieldStore<T, V>(context: ClassFieldDecoratorContext<T, V>, onInitialValue?: (initial: V) => void): void {
	const key = context.name;
	const wired = wiredFields(context.metadata as object);

	if (wired.has(key)) {
		// Already wired by the other decorator - stay transparent: don't redefine the property a
		// second time; the resolved (store-backed) value is already readable off `this[key]` by the
		// time this `addInitializer` runs, since `addInitializer`s run in the same order decorators
		// were applied.
		if (onInitialValue) {
			// @attribute() needs the initial value to infer a converter type
			context.addInitializer(function (this: T): void {
				onInitialValue((this as unknown as Record<PropertyKey, { peek(): V }>)[key].peek());
			});
		}
		return;
	}
	wired.add(key);

	context.addInitializer(function (this: T): void {
		const initial = (this as unknown as Record<PropertyKey, V>)[key];
		onInitialValue?.(initial);
		const store = createStore(initial);
		Object.defineProperty(this, key, { // we replaced the instance’s own data property for that key with a getter that returns the store
			// Read-only accessor returning the store itself: `this.count()` reads, `this.count.set(v)` writes.
			get() {
				return store;
			},
			enumerable: true,
			configurable: true,
		});
	});
}
