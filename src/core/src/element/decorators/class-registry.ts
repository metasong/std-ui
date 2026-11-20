// Shared per-class registration store behind `@attribute`, `@provide` and `@consume` (and the
// matching `defineElement` options). One `ClassRegistry<D>` per kind of def, each keeping its defs in the
// class's stage-3 decorator metadata object:
//   - decorators write to `context.metadata`, which every decorator on a class (member *and* class)
//     receives as the *same* object; and
//   - `defineElement(...)` has no decorator context, so it writes to `ownMetadata(ctor)` instead.
// Readers (`UIElement`, `tag()`) see both through `get()`. Nothing is kept per instance.
//
// Why `context.metadata` and not `ctor[Symbol.metadata]` for decorators: the latter is only assigned
// after the class is fully defined (class decorators have already run), so `read(meta)` takes the
// decorator's `context.metadata` directly for a class decorator (`tag()`) reading what member
// decorators registered *during its own call*.

/**
 * Standard (stage-3) decorators key per-class metadata off `Symbol.metadata`, which not every engine
 * declares (nor this project's `lib` setting types) - polyfilled once, with our own reference so we
 * don't depend on the `SymbolConstructor.metadata` type.
 */
export const metadataSymbol: symbol = ((Symbol as unknown as Record<string, symbol>).metadata ??= Symbol('Symbol.metadata'));

/**
 * The metadata object that belongs to `ctor` itself, creating it if needed (what a decorated class
 * already has, but a plain class doesn't). It must be created: a subclass *inherits* its parent's
 * `Class[Symbol.metadata]` through the static prototype chain, and registering onto that would leak
 * the subclass's defs into the parent. The new object has the parent's metadata as its prototype,
 * mirroring the class hierarchy like the engine does.
 *
 * The prototype link is made **once**, when `ctor`'s own object is created, and points at the nearest
 * ancestor metadata that exists *at that moment*. So register a base class (`defineElement(Base, ...)`)
 * **before** its subclasses are registered, as decorators naturally do; a base registered after a
 * subclass is invisible to that subclass. (Creating metadata on every ancestor would reach native
 * classes such as `HTMLElement`, so it is deliberately not done.)
 */
export function ownMetadata(ctor: Function): object {
	const holder = ctor as unknown as Record<symbol, object | undefined>;
	if (!Object.prototype.hasOwnProperty.call(ctor, metadataSymbol)) {
		Object.defineProperty(ctor, metadataSymbol, {
			value: Object.create(holder[metadataSymbol] ?? null), // holder[metadataSymbol] is the nearest ancestor metadata that exists at that moment
			writable: true,
			configurable: true,
			enumerable: false,
		});
	}
	return holder[metadataSymbol]!;
}

export interface ClassRegistry<D> {
	/** Records `def` onto a class's metadata object - `context.metadata` in a decorator, `ownMetadata(ctor)` otherwise. */
	register(meta: object, def: D): void;
	/** Whether `def` is already registered on `meta` or any ancestor metadata (identity comparison). */
	has(meta: object, def: D): boolean;
	/**
	 * Every def reachable from a metadata object (itself and ancestors), most-derived class first.
	 * Use this while a decorator is still running, passing its `context.metadata` (see the file header).
	 */
	read(meta: object | null | undefined): readonly D[];
	/** Every def of `ctor` and its ancestors, most-derived class first (reads `ctor[Symbol.metadata]`). */
	get(ctor: Function): readonly D[];
}

/** `name` only labels the metadata slot (a fresh `Symbol(name)`), so registries never collide. */
export function createClassRegistry<D>(name: string): ClassRegistry<D> {
	const metaKey = Symbol(name);
	const hasOwn = (object: object, key: symbol): boolean => Object.prototype.hasOwnProperty.call(object, key);

	const registry: ClassRegistry<D> = {
		register(meta, def) {
			const typed = meta as Record<symbol, D[] | undefined>;
			// Own-property check: a subclass's metadata object inherits the base's through its prototype,
			// so never push onto an inherited array.
			if (!hasOwn(typed, metaKey)) typed[metaKey] = [];
			typed[metaKey]!.push(def);
		},

		has(meta, def) {
			return registry.read(meta).includes(def);
		},

		get(ctor) {
			return registry.read((ctor as unknown as Record<symbol, object | undefined>)[metadataSymbol]);
		},

		read(meta) {
			const defs: D[] = [];
			// Metadata objects mirror the class hierarchy through their prototype chain.
			for (let level: object | null = meta ?? null; level; level = Object.getPrototypeOf(level)) {
				if (hasOwn(level, metaKey)) defs.push(...(level as Record<symbol, D[]>)[metaKey]!);
			}
			return defs;
		},
	};
	return registry;
}
