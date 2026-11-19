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
		// Duck-typed link to the form UI feature (when present): disabled nodes are not validated.
		() => !!(n as { formUi?: { disabled(): boolean } }).formUi?.disabled(),
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
	suppressed?: () => boolean,
): Validation<T> {
	const validators = signal<Validator<T>[]>([], { equals: () => false });
	const enabled = signal(true);
	// Off when switched off, or (default) when the node's form UI says it is disabled.
	const off = () => !enabled() || !!suppressed?.();
	const ownErrors = computed<ValidationError[]>(
		() => {
			if (off()) return [];
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
	const pendingOwn = computed(() => {
		if (off()) return false;
		const value = read();
		let any = false;
		// No early exit: every pending() call also (re)starts that validator's request for `value`.
		for (const v of validators()) if (v.pending?.(value)) any = true;
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
	return { validators, enabled, errors, pending, valid };
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
		const own = (child as { check?: Validation<any> }).check; // custom node with its own `check`
		if (own || !isTreeNode(child)) return { check: own, nested: [] };
		return { nested: childEntries(child) as Entries }; // tree node never given `check`: valid unless a descendant has one
	}
	builtVersion(); // tracked: a later build must re-run the aggregate
	if (state.built) return { check: state.built, nested: [] };
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
export function attachCheck<T>(node: object, read: () => T, children?: () => Entries, suppressed?: () => boolean): void {
	if ((node as { [STATE]?: CheckState })[STATE]) return; // already has `check`
	const state: CheckState = { children };
	(node as { [STATE]?: CheckState })[STATE] = state; // plain assignment: far cheaper than defineProperty
	Object.defineProperty(node, 'check', {
		get: () => {
			if (!state.built) {
				state.built = createValidation(read, children, suppressed);
				builtVersion.set(builtVersion.peek() + 1);
			}
			return state.built;
		},
	});
}
