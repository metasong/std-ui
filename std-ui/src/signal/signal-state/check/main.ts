// Validation layer for tree nodes. Nothing here is built until a node's `check` is first read:
// `attachCheck()` defines `check` as a lazy getter, so nodes nobody validates cost nothing.

import { computed, signal, type Computed, type Signal } from '../../core/index.js';
import type { ValidityFlag } from '../flags.js';
import type { ItemNode } from '../node.js';

export interface ValidationError {
	/** One of the well-known `flags` (the `ValidityState` flag names), e.g. `flags.tooShort`. */
	flag: ValidityFlag;
	message: string;
}

/** An error plus where it came from, relative to the node it was read from ([] = the node itself). */
export interface PathError extends ValidationError {
	path: (string | number)[];
}

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

/** Mixin carried by every tree node: its validation members under check. */
export interface Checked<T> {
	readonly check: Validation<T>;
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
		for (const [, child] of children()) if (child.check?.allPending?.()) return true;
		return false;
	});
	const valid = computed(() => errors().length === 0 && !pending());
	const allValid = computed(() => {
		if (errors().length || pending()) return false;
		for (const [, child] of children()) if (child.check && !child.check.allValid()) return false;
		return true;
	});
	const allErrors = computed<PathError[]>(() => {
		// Post-order: each child's subtree (deepest first), then this node's own errors.
		const out: PathError[] = [];
		for (const [key, child] of children()) {
			for (const e of child.check?.allErrors() ?? []) out.push({ ...e, path: [key, ...e.path] });
		}
		for (const e of errors()) out.push({ ...e, path: [] });
		return out;
	});
	return { validators, errors, pending, allPending, valid, allValid, allErrors };
}

/**
 * Defines `node.check` as a lazy getter: the validation members are built on the first read and
 * cached. `read` / `children` are the same arguments as for `createValidation`.
 */
export function attachCheck<T>(
	node: object,
	read: () => T,
	children?: () => readonly (readonly [string | number, ItemNode<unknown>])[],
): void {
	let built: Validation<T> | undefined;
	Object.defineProperty(node, 'check', {
		get: () => (built ??= createValidation(read, children)),
	});
}
