// Public and internal types for `bind()`. See `./design.md` for the mental model.

/** How deep a model read tracks on a signal-tree node (see BindOptions.depth). */
export type BindDepth = 'value' | 'shallow' | 'deep';

/** Model side for `bind({ get, set })` when you don't have a signal. */
export interface BindAccessor {
	get: () => unknown;
	set: (value: unknown) => void;
}

/** View-side hooks; every one is optional and has a default derived from the element + property. */
export interface BindOptions {
	/**
	 * How deep model reads track changes on a signal-tree node (signal form only; ignored for
	 * `{ get, set }`). Same option name and values as `state`'s `depth`:
	 * - `'value'` → `node()`: only replacement of the node's value.
	 * - `'shallow'` → `node.shallow()`: + structural changes (key add/delete, push/splice/reorder).
	 * - `'deep'` → `node.deep()`: + any value change below, recursively.
	 * All three yield the same plain value. Plain signals without `shallow()` / `deep()` fall back to
	 * `node()`. Default: `'deep'`.
	 */
	depth?: BindDepth;
	/**
	 * DOM event that means "the user (or component) changed the bound property".
	 * Defaults: native `.value` → `input` (`change` for `<select>`), checkbox/radio `.checked` →
	 * `change`, otherwise `${kebab-case property}-change` (`.minValue` → `min-value-change`).
	 */
	event?: string;
	/**
	 * Compares the value from the model (`get()`) with the value read from the element
	 * (`read(element, property)`); return `true` when they already match.
	 * Used in both directions to skip redundant writes (live semantics):
	 * - model → view (every render): if equal, the element is not written.
	 * - view → model (on `event`): if equal, `set()` is not called.
	 * Defaults: boolean compare for checkbox/radio `.checked`, string compare for native `.value`
	 * (so `5` equals `'5'`), `Object.is` otherwise.
	 */
	equals?: (model: unknown, view: unknown) => boolean;
	/** Read the element's current value. Also the view → model converter: return model-typed values. */
	read?: (element: Element, property: string) => unknown;
	/** Push a model value into the element. Also the model → view converter. */
	write?: (element: Element, property: string, model: unknown) => void;
}

/** `bind({ get, set, ...options })` — accessor and options in one object. */
export type BindSource = BindAccessor & BindOptions;

/** Anything callable to read with a `.set()` to write: `state()` or a `stateTree()` node. */
export interface WritableSignal<T = unknown> {
	(): T;
	set(value: never): void;
}

/** A fully resolved binding: the model side, the view side, and how to compare / convert. */
export interface Binding {
	readonly model: BindAccessor;
	readonly view: {
		readonly event: string;
		readonly read: (element: Element, property: string) => unknown;
		readonly write: (element: Element, property: string, model: unknown) => void;
	};
	readonly equals: (model: unknown, view: unknown) => boolean;
	/** Applied to a view value before it is stored in the model (keeps numeric models numeric). */
	readonly coerce: (view: unknown, currentModel: unknown) => unknown;
}

/** What a `BindPlugin` is told about the bound position. */
export interface BindPluginContext {
	readonly element: Element;
	readonly property: string;
	/** The latest first argument of `bind()` (a signal/state node or an accessor); refreshed every render. */
	readonly source: () => unknown;
}

/**
 * Element-side extension of a bind directive (see `createBind`). Runs once per bound element (again
 * if the element changes); the returned disposer runs on element change and on disconnect.
 */
export type BindPlugin = (context: BindPluginContext) => (() => void) | void;
