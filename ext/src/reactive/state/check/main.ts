// Validation layer for tree nodes, kept separate from the state core: a plain `state()` has no
// `check`; `check(state(...))` adds it to the node and every descendant (including members added
// later) and returns the same tree typed with `check` on each node. Nothing is built until a
// node's `check` is first read: it is a lazy getter, so nodes nobody validates cost nothing.

import type { WithFeature } from '../tree-feature.js';
import {
	childEntries,
	computed,
	extendTree,
	isTreeNode,
	signal,
	type Computed,
	type ItemNode,
	type Signal,
	type SignalArray,
	type SignalObject,
	type TreeNode,
} from '@std-ui/core';
import type { PathError, ValidationError } from './validation.js';

export type { PathError, ValidationError };

/** Returns the error(s) for `value`, or nothing when it is valid. Runs on plain (raw) values. */
export type Validator<T> = ((
	value: T,
) => ValidationError | readonly ValidationError[] | null | undefined | void) & {
	/**
	 * Optional, for async validators: tracked; true while the result for `value` is not known yet.
	 * Pending validators make the node's `valid` / `valid.own` false.
	 */
	readonly pending?: (value: T) => boolean;
};

/** Validation members, grouped under `node.check` on every tree node. Reads of the node itself stay plain `T`. */
export interface Validation<T> {
	/** Validators for this node's own value; replace them with `validators.set([...])`. */
	readonly validators: Signal<Validator<T>[]>;
	/**
	 * Switch for this node's own validation, default `true`. While `false` its validators are not run:
	 * no own errors, not pending, so `valid.own` is true (like a disabled form control). Descendants
	 * are unaffected; they keep their own `enabled`.
	 */
	readonly enabled: Signal<boolean>;
	/**
	 * Tracked errors from this node's own validators only (`[]` when valid). `errors.all` lists the
	 * errors of this node and all descendants, each with its path below this node (post-order: each
	 * child's subtree, deepest first, then this node's own errors).
	 */
	readonly errors: Computed<ValidationError[]> & { readonly all: Computed<PathError[]> };
	/**
	 * Tracked; true while this node or any descendant is pending. `pending.own` is true while any of
	 * this node's own validators is still waiting for a result (async).
	 */
	readonly pending: Computed<boolean> & { readonly own: Computed<boolean> };
	/**
	 * Tracked; true when this node and every descendant has no errors and nothing is pending. Without
	 * async validators it equals `errors.all().length === 0`, but cheaper (stops at the first error, builds no list) and only
	 * notifies when the boolean flips, not on every error change. `valid.own` is the same for this
	 * node's own validators only (descendants ignored).
	 */
	readonly valid: Computed<boolean> & { readonly own: Computed<boolean> };
}

/** Mixin added to every node by `check()`: its validation members under `check`. */
export interface Checked<T> {
	readonly check: Validation<T>;
}

declare module '../tree-feature.js' {
	interface TreeFeatures<T> {
		check: Checked<T>;
	}
	interface ArrayExtras<U> {
		/** On arrays: `check.itemValidators` are run by every item (existing and added later), reported at the item's index. */
		check: { readonly check: { readonly itemValidators: Signal<Validator<U>[]> } };
	}
}

/**
 * A state tree `S` after `check()`: the same tree, with `check` on every node (members and items
 * too). Built on `S` itself (not rebuilt), so other features already on it are kept.
 */
export type WithCheck<S> = WithFeature<S, 'check'>;

/**
 * Adds validation to a state tree: `check(state({ name: '' })).name.check.validators.set([...])`.
 * Returns the same tree (not a copy), typed with `check` on every node. Members added later
 * (`push`, new keys) get `check` too. Safe to apply twice.
 */
export function check<S extends TreeNode>(node: S): WithCheck<S> {
	extendTree(node, attach);
	return node as unknown as WithCheck<S>;
}

/** The `check()` extension: lazily gives one node its `check`. */
const isArrayNode = (n: object): boolean =>
	typeof (n as { at?: unknown }).at === 'function' && typeof (n as { push?: unknown }).push === 'function';

function attach(node: object, parent?: object): void {
	const n = node as TreeNode & { shallow?: () => unknown };
	attachCheck(
		n,
		() => n.deep(),
		() => {
			n.shallow?.(); // tracked: which members exist
			return childEntries(n) as Entries;
		},
		// Duck-typed link to the form UI feature (when present): disabled nodes are not validated.
		() => !!(n as { formUi?: { disabled(): boolean } }).formUi?.disabled(),
		{
			// Items of an array also run that array's `itemValidators`.
			inherited: parent && isArrayNode(parent) ? () => (parent as { [STATE]: CheckState })[STATE].itemRules!() : undefined,
			hasItems: isArrayNode(n),
		},
	);
}

const sameErrors = (a: ValidationError[], b: ValidationError[]): boolean =>
	a.length === b.length && a.every((e, i) => e.flag === b[i].flag && e.message === b[i].message);

/** What `attachCheck` needs to know about a node's place in the tree. */
interface AttachExtra<T> {
	inherited?: () => readonly Validator<T>[];
	/** True for array nodes: they own an `itemValidators` signal. */
	hasItems?: boolean;
}

/** Extra inputs of `createValidation` that come from the node's place in the tree. */
interface ValidationExtra<T> {
	/** Tracked rules inherited from the parent array's `itemValidators`. */
	inherited?: () => readonly Validator<T>[];
	/** Set on array nodes: exposed as `check.itemValidators`. */
	itemValidators?: Signal<Validator<any>[]>;
}

/**
 * Builds the validation members for a node. `read` is the tracked plain value the validators see;
 * `children` lists the node's current child nodes (tracked), for the aggregate `valid`.
 */
export function createValidation<T>(
	read: () => T,
	children: () => readonly (readonly [string | number, ItemNode<unknown>])[] = () => [],
	suppressed?: () => boolean,
	extra: ValidationExtra<T> = {},
): Validation<T> {
	const { inherited, itemValidators } = extra;
	const validators = signal<Validator<T>[]>([], { equals: () => false });
	const enabled = signal(true);
	// The array's item rules (if this node is an item) run before the node's own.
	const rules = (): readonly Validator<T>[] => [...(inherited?.() ?? []), ...validators()];
	// Off when switched off, or (default) when the node's form UI says it is disabled.
	const off = () => !enabled() || !!suppressed?.();
	const ownErrors = computed<ValidationError[]>(
		() => {
			if (off()) return [];
			const value = read();
			const out: ValidationError[] = [];
			for (const validate of rules()) {
				const result = validate(value);
				if (!result) continue;
				if (Array.isArray(result)) out.push(...(result as ValidationError[]));
				else out.push(result as ValidationError);
			}
			return out;
		},
		{ equals: sameErrors },
	);
	const pendingOwn = computed(() => {
		if (off()) return false;
		const value = read();
		let any = false;
		// No early exit: every pending() call also (re)starts that validator's request for `value`.
		for (const v of rules()) if (v.pending?.(value)) any = true;
		return any;
	});
	const pending = Object.assign(
		computed(() => {
			if (pendingOwn()) return true;
			for (const [, child] of children()) if (childPending(child)) return true;
			return false;
		}),
		{ own: pendingOwn },
	);
	const validOwn = computed(() => ownErrors().length === 0 && !pendingOwn());
	const valid = Object.assign(
		computed(() => {
			if (!validOwn()) return false;
			for (const [, child] of children()) if (!isAllValid(child)) return false;
			return true;
		}),
		{ own: validOwn },
	);
	const allErrors = computed<PathError[]>(() => {
		// Post-order: each child's subtree (deepest first), then this node's own errors.
		const out: PathError[] = [];
		for (const [key, child] of children()) {
			for (const e of errorsOf(child)) out.push({ ...e, path: [key, ...e.path] });
		}
		for (const e of ownErrors()) out.push({ ...e, path: [] });
		return out;
	});
	const errors = Object.assign(ownErrors, { all: allErrors });
	return { validators, enabled, errors, pending, valid, ...(itemValidators ? { itemValidators } : {}) };
}

type Entries = readonly (readonly [string | number, ItemNode<unknown>])[];

// Per-node record of the lazy `check`: whether it was built yet, and how to list the node's children.
const STATE = Symbol('check-state');
interface CheckState {
	built?: Validation<any>;
	children?: () => Entries;
	make?: () => Validation<any>;
	/** Array nodes: the rules every item inherits (check.itemValidators). */
	itemRules?: Signal<Validator<any>[]>;
	inherited?: () => readonly unknown[];
}
/** Bumped whenever any node builds its `check`, so aggregates that skipped it re-evaluate. */
const builtVersion = signal(0);

/**
 * How a parent aggregate sees a child without forcing it to build `check`: its built validation,
 * or (when none was built) the child's own children, which are valid unless one of them built one.
 */
function view(child: ItemNode<unknown>): { check?: Validation<any>; nested: Entries } {
	const state = (child as { [STATE]?: CheckState })[STATE];
	if (!state) {
		const own = (child as { check?: Validation<any> }).check; // custom node with its own `check`
		if (own || !isTreeNode(child)) return { check: own, nested: [] };
		return { nested: childEntries(child) as Entries }; // tree node never given `check`: valid unless a descendant has one
	}
	builtVersion(); // tracked: a later build must re-run the aggregate
	if (state.built) return { check: state.built, nested: [] };
	// An item that inherits array rules must be validated even though nobody read its `check`.
	// (Built here without bumping `builtVersion`: this reads `inherited()`, so it re-runs on its own.)
	if (state.make && state.inherited?.().length) return { check: (state.built = state.make()), nested: [] };
	return { nested: state.children?.() ?? [] };
}
function isAllValid(child: ItemNode<unknown>): boolean {
	const v = view(child);
	if (v.check) return v.check.valid();
	return v.nested.every(([, c]) => isAllValid(c));
}
function childPending(child: ItemNode<unknown>): boolean {
	const v = view(child);
	if (v.check) return !!v.check.pending?.();
	return v.nested.some(([, c]) => childPending(c));
}
function errorsOf(child: ItemNode<unknown>): PathError[] {
	const v = view(child);
	if (v.check) return v.check.errors.all();
	const out: PathError[] = [];
	for (const [key, c] of v.nested) for (const e of errorsOf(c)) out.push({ ...e, path: [key, ...e.path] });
	return out;
}

/**
 * Defines `node.check` as a lazy getter: the validation members are built on the first read and
 * cached. `read` / `children` are the same arguments as for `createValidation`. Parent aggregates
 * look through unbuilt nodes, so reading a parent's `valid` etc. does not build its descendants.
 */
export function attachCheck<T>(node: object, read: () => T, children?: () => Entries, suppressed?: () => boolean, extra: AttachExtra<T> = {}): void {
	if ((node as { [STATE]?: CheckState })[STATE]) return; // already has `check`
	const state: CheckState = { children, inherited: extra.inherited };
	if (extra.hasItems) state.itemRules = signal<Validator<any>[]>([], { equals: () => false });
	state.make = () => createValidation(read, children, suppressed, { inherited: extra.inherited, itemValidators: state.itemRules });
	(node as { [STATE]?: CheckState })[STATE] = state; // plain assignment: far cheaper than defineProperty
	Object.defineProperty(node, 'check', {
		get: () => {
			if (!state.built) {
				state.built = state.make!();
				builtVersion.set(builtVersion.peek() + 1);
			}
			return state.built;
		},
	});
}
