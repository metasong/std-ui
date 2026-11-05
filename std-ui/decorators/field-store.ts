// Shared field/accessor decorator mechanics for turning a class field into a store-backed
// property (see `./store.ts`). Both `@state()` (`./state.decorator.ts`, store only) and `@attribute()`
// (`./attribute.decorator.ts`, store + attribute sync) delegate here instead of duplicating the
// accessor-vs-plain-field branching - `@attribute()` is "everything `@state()` does, plus
// attribute registration/sync", so this is the one piece of logic they share.
//
// See `./design.md` for the full accessor/plain-field mechanics and why the naive alternative
// (installing the accessor on the prototype once, from a class decorator) doesn't work.

import { createStore } from './store.js';

export type FieldDecoratorResult<T, V> = ClassAccessorDecoratorResult<T, V> | ((this: T, value: V) => V) | void;

// `@state()` and `@attribute()` aren't meant to be stacked on the same field, but rather than
// throwing if they are, `applyFieldStore()` stays compatible: it tracks which fields it has
// already wired (per class, via `context.metadata` - shared across every decorator on the class,
// same mechanism `./metadata.ts` uses) and, if the *other* decorator already wired this exact
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
 * Applies the store-backed `get`/`set` wiring to a decorated field (accessor or plain) - the
 * entire body of what used to be `@property()`, minus any attribute concern. `onInitialValue`, if
 * given, runs once per instance with the field's initial value, right as its store is created -
 * `@attribute()` uses this to resolve a type-inferred converter once that value is known (see
 * `./attribute.decorator.ts`); `@state()` doesn't need it.
 *
 * `accessor` fields: this decorator is called as a **class accessor decorator**, returning a
 * replacement `get`/`set` pair backed by a per-instance store kept in the accessor's own private
 * storage slot (`target.get`/`target.set`) - `init()` wraps the field's initializer value with
 * `createStore()` instead of storing it raw.
 *
 * Plain fields: this decorator is called as a **class field decorator**, which can't return a
 * `get`/`set` pair - a plain field has no such slot to replace. Instead, the field's own
 * initializer runs untouched (`this.key = initialValue`, an ordinary own data property), and
 * `context.addInitializer` - which runs with `this` bound to the instance, immediately *after*
 * that field is set - replaces that *same* own property with a store-backed accessor via
 * `Object.defineProperty`, before the constructor can run any later code. A plain field can't
 * delegate through a prototype `get`/`set` the way an `accessor` field can: class field
 * initializers always use `[[DefineOwnProperty]]` straight onto the instance, bypassing any
 * inherited/decorator-installed accessor - redefining the instance's own property, right after
 * it's created, avoids this.
 *
 * Stacking `@state()` and `@attribute()` on the same field: decorators on one class element apply
 * bottom-up (the one closest to the field runs first). Whichever of the two runs first wins - it
 * does the real wiring and marks the field as wired in `context.metadata`. The second one to run
 * sees that mark and skips wiring entirely (no second store, no double `Object.defineProperty`/
 * accessor layer) - it only still forwards the resolved initial value to its own `onInitialValue`
 * if given, since the field's own property already resolves through the winning store by then.
 * `@attribute()` always registers its `AttributeDef` regardless of which one wins (see
 * `./attribute.decorator.ts`), so attribute parsing/reflection keeps working through whichever store ends
 * up backing the field.
 */
export function applyFieldStore<T, V>(
	target: ClassAccessorDecoratorTarget<T, V> | undefined,
	context: ClassAccessorDecoratorContext<T, V> | ClassFieldDecoratorContext<T, V>,
	onInitialValue?: (initial: V) => void,
): FieldDecoratorResult<T, V> {
	const key = context.name;
	const wired = wiredFields(context.metadata as object);

	if (wired.has(key)) {
		// Already wired by the other decorator - stay transparent: for a plain field, don't
		// redefine the property a second time; the resolved (store-backed) value is already
		// readable off `this[key]` by the time this `addInitializer` runs, since `addInitializer`s
		// run in the same order decorators were applied. For an `accessor` field, returning nothing
		// leaves the previous decorator's get/set/init entirely in place.
		if (context.kind === 'field' && onInitialValue) {
			// @attribute() needs the initial value to infer a converter type
			context.addInitializer(function (this: T): void {
				onInitialValue((this as unknown as Record<PropertyKey, V>)[key]);
			});
		}
		return;
	}
	wired.add(key);

	if (context.kind === 'accessor') {
		const accessorTarget = target as ClassAccessorDecoratorTarget<T, V>;
		return {
			get(this: T): V {
				const store = accessorTarget.get.call(this) as unknown as { (): V };
				return store();
			},
			set(this: T, value: V): void {
				if (value === undefined) return; // a converter's `fromAttribute` returning `undefined` means "leave untouched"
				const store = accessorTarget.get.call(this) as unknown as { set(value: V): void };
				store.set(value);
			},
			init(this: T, value: V): V {
				onInitialValue?.(value);
				return createStore(value) as unknown as V;
			},
		};
	}

	// Plain field (`context.kind === 'field'`).
	context.addInitializer(function (this: T): void {
		const initial = (this as unknown as Record<PropertyKey, V>)[key];
		onInitialValue?.(initial);
		const store = createStore(initial);
		Object.defineProperty(this, key, {
			get(): V {
				return store();
			},
			set(value: V): void {
				if (value === undefined) return;
				store.set(value as never);
			},
			enumerable: true,
			configurable: true,
		});
	});
}
