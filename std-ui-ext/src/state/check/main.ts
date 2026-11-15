// Validation layer for tree nodes, kept separate from the state core: a plain `state()` has no
// `check`; `check(state(...))` adds it to the node and every descendant (including members added
// later) and returns the same tree typed with `check` on each node. Nothing is built until a
// node's `check` is first read: it is a lazy getter, so nodes nobody validates cost nothing.

import {
	childEntries,
	computed,
	extendTree,
	isTreeNode,
	signal,
	type Computed,
	type ItemNode,
	type PathError,
	type Signal,
	type SignalArray,
	type SignalObject,
	type TreeNode,
	type ValidationError,
} from 'std-ui';

export type { PathError, ValidationError };

/** Returns the error(s) for `value`, or nothing when it is valid. Runs on plain (raw) values. */
export type Validator<T> = ((
	value: T,
) => ValidationError | readonly ValidationError[] | null | undefined | void) & {
	/**
	 * Optional, for async validators: tracked; true while the result for `value` is not known yet.
	 * Pending validators make the node's `valid` / `allValid` false.
	 */
	readonly pending?: (value: T) => boolean;
};

/** Validation members, grouped under `node.check` on every tree node. Reads of the node itself stay plain `T`. */
export interface Validation<T> {
	/** Validators for this node's own value; replace them with `validators.set([...])`. */
	readonly validators: Signal<Validator<T>[]>;
	/** Tracked errors from this node's own validators only (`[]` when valid). */
	readonly errors: Computed<ValidationError[]>;
	/** Tracked; true while any of this node's own validators is still waiting for a result (async). */
	readonly pending: Computed<boolean>;
	/** Tracked; true while this node or any descendant is pending. */
	readonly allPending: Computed<boolean>;
	/**
	 * Tracked; true when this node's own validators report no errors and none is pending
	 * (descendants ignored).
	 */
	readonly valid: Computed<boolean>;
	/**
	 * Tracked; true when this node and every descendant has no errors and nothing is pending. Without
	 * async validators it equals `allErrors().length === 0`, but cheaper (stops at the first error, builds no list) and only
	 * notifies when the boolean flips, not on every error change.
	 */
	readonly allValid: Computed<boolean>;
	/** Tracked; errors of this node and all descendants, each with its path below this node.
	 * Post-order: each child's subtree (deepest first), then this node's own errors. */
	readonly allErrors: Computed<PathError[]>;
}

/** Mixin added to every node by `check()`: its validation members under `check`. */
export interface Checked<T> {
	readonly check: Validation<T>;
}

type CheckedMembers<M> = { readonly [K in keyof M]: WithCheck<M[K]> };

/**
 * A state tree `S` after `check()`: the same tree, with `check` on every node (members and items
 * too). Built on `S` itself (not rebuilt), so other features already on it are kept.
 */
export type WithCheck<S> =
	S extends SignalArray<infer U, infer N>
		? {
				at(index: number): WithCheck<N> | undefined;
				readonly [index: number]: WithCheck<N> | undefined;
			} & S &
				Checked<U[]>
		: S extends SignalObject<infer T, infer M, any>
			? { readonly _: CheckedMembers<M> } & { readonly [K in keyof T]: WithCheck<S[K & keyof S]> } & S & Checked<T>
			: S extends { peek(): infer T }
				? S & Checked<T>
				: S;

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
function attach(node: object): void {
	const n = node as TreeNode & { shallow?: () => unknown };
	attachCheck(
		n,
		() => n.deep(),
		() => {
			n.shallow?.(); // tracked: which members exist
			return childEntries(n) as Entries;
		},
	);
}

const sameErrors = (a: ValidationError[], b: ValidationError[]): boolean =>
	a.length === b.length && a.every((e, i) => e.flag === b[i].flag && e.message === b[i].message);

/**
 * Builds the validation members for a node. `read` is the tracked plain value the validators see;
 * `children` lists the node's current child nodes (tracked), for the aggregate `valid`.
 */
export function createValidation<T>(
	read: () => T,
	children: () => readonly (readonly [string | number, ItemNode<unknown>])[] = () => [],
): Validation<T> {
	const validators = signal<Validator<T>[]>([], { equals: () => false });
	const errors = computed<ValidationError[]>(
		() => {
			const value = read();
			const out: ValidationError[] = [];
			for (const validate of validators()) {
				const result = validate(value);
				if (!result) continue;
				if (Array.isArray(result)) out.push(...(result as ValidationError[]));
				else out.push(result as ValidationError);
			}
			return out;
		},
		{ equals: sameErrors },
	);
	const pending = computed(() => {
		const value = read();
		let any = false;
		// No early exit: every pending() call also (re)starts that validator's request for `value`.
		for (const v of validators()) if (v.pending?.(value)) any = true;
		return any;
	});
	const allPending = computed(() => {
		if (pending()) return true;
		for (const [, child] of children()) if (anyPending(child)) return true;
		return false;
	});
	const valid = computed(() => errors().length === 0 && !pending());
	const allValid = computed(() => {
		if (errors().length || pending()) return false;
		for (const [, child] of children()) if (!isAllValid(child)) return false;
		return true;
	});
	const allErrors = computed<PathError[]>(() => {
		// Post-order: each child's subtree (deepest first), then this node's own errors.
		const out: PathError[] = [];
		for (const [key, child] of children()) {
			for (const e of errorsOf(child)) out.push({ ...e, path: [key, ...e.path] });
		}
		for (const e of errors()) out.push({ ...e, path: [] });
		return out;
	});
	return { validators, errors, pending, allPending, valid, allValid, allErrors };
}

type Entries = readonly (readonly [string | number, ItemNode<unknown>])[];

// Per-node record of the lazy `check`: whether it was built yet, and how to list the node's children.
const STATE = Symbol('check-state');
interface CheckState {
	built?: Validation<any>;
	children?: () => Entries;
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
		const own = child.check as Validation<any> | undefined; // custom node with its own `check`
		if (own || !isTreeNode(child)) return { check: own, nested: [] };
		return { nested: childEntries(child) as Entries }; // tree node never given `check`: valid unless a descendant has one
	}
	builtVersion(); // tracked: a later build must re-run the aggregate
	if (state.built) return { check: state.built, nested: [] };
	return { nested: state.children?.() ?? [] };
}
function isAllValid(child: ItemNode<unknown>): boolean {
	const v = view(child);
	if (v.check) return v.check.allValid();
	return v.nested.every(([, c]) => isAllValid(c));
}
function anyPending(child: ItemNode<unknown>): boolean {
	const v = view(child);
	if (v.check) return !!v.check.allPending?.();
	return v.nested.some(([, c]) => anyPending(c));
}
function errorsOf(child: ItemNode<unknown>): PathError[] {
	const v = view(child);
	if (v.check) return v.check.allErrors();
	const out: PathError[] = [];
	for (const [key, c] of v.nested) for (const e of errorsOf(c)) out.push({ ...e, path: [key, ...e.path] });
	return out;
}

/**
 * Defines `node.check` as a lazy getter: the validation members are built on the first read and
 * cached. `read` / `children` are the same arguments as for `createValidation`. Parent aggregates
 * look through unbuilt nodes, so reading a parent's `allValid` etc. does not build its descendants.
 */
export function attachCheck<T>(node: object, read: () => T, children?: () => Entries): void {
	if ((node as { [STATE]?: CheckState })[STATE]) return; // already has `check`
	const state: CheckState = { children };
	(node as { [STATE]?: CheckState })[STATE] = state; // plain assignment: far cheaper than defineProperty
	Object.defineProperty(node, 'check', {
		get: () => {
			if (!state.built) {
				state.built = createValidation(read, children);
				builtVersion.set(builtVersion.peek() + 1);
			}
			return state.built;
		},
	});
}
