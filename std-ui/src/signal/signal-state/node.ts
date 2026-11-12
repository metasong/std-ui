// Shared contract between the tree's container nodes (`./array`, `./object`) and their children.

import { computed, signal, type Computed, type Signal } from '../core/index.js';
import type { ValidityKind } from './kinds.js';

export interface ValidationError {
	/** One of the well-known `kinds` (the `ValidityState` flag names), e.g. `kinds.tooShort`. */
	kind: ValidityKind;
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

/** Mixin carried by every tree node: its change-tracking members under `changes`. */
export interface Tracked<T> {
	readonly changes: ChangeTracking<T>;
}

/** Change-tracking members (`dirty`, `reset`), grouped under `node.changes`. */
export interface ChangeTracking<T> {
	/** Tracked; true when the node's current value differs (deeply) from its initial value. */
	readonly dirty: Computed<boolean>;
	/**
	 * Writes the initial value back (members added since are removed, deleted ones re-created). With
	 * `next`, `next` first becomes the new initial value, e.g. `reset(node.peek())` marks the current
	 * value as saved.
	 */
	reset(next?: T): void;
}

/**
 * Minimal node contract needed from each child node (satisfied by `Signal`, arrays, and objects).
 * Only what a parent reads from a child is listed: `valid` and `allErrors` for its own aggregates.
 * `errors` is not needed (it is already part of the child's `allErrors`).
 */
export interface ItemNode<T> {
	(): T;
	peek(): T;
	set(value: any): void;
	/** Present on tree nodes; plain signals have none and count as valid. */
	check?: { allValid: () => boolean; allErrors: () => PathError[]; allPending?: () => boolean };
	changes?: { reset: (next?: any) => void };
}

/**
 * Tracked plain-value read of any signal. Every tree node has `deep()`; this also accepts plain
 * core / standard signals (`signal()`, `computed()`, `toSignal()`), which only have `()`.
 */
export function readValue<T>(node: ItemNode<T>): T {
	const deep = (node as { deep?: () => T }).deep;
	return typeof deep === 'function' ? deep() : node();
}

const sameErrors = (a: ValidationError[], b: ValidationError[]): boolean =>
	a.length === b.length && a.every((e, i) => e.kind === b[i].kind && e.message === b[i].message);

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

/** Structural equality for plain data: arrays and plain objects recurse, `Date` by time, else `Object.is`. */
export function deepEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (a instanceof Date || b instanceof Date) {
		return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
	}
	if (Array.isArray(a) || Array.isArray(b)) {
		return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
	}
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	return (
		ka.length === kb.length &&
		ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual((a as any)[k], (b as any)[k]))
	);
}

/**
 * Builds the `dirty` / `reset` members for a node. `read` is the tracked plain value, `initial` the
 * first initial value, and `restore` the node's own write-back of an initial value (parents also
 * push it to their children, so every level agrees on the new one).
 */
export function createChangeTracking<T>(
	read: () => T,
	initial: T,
	restore: (initial: T) => void,
): ChangeTracking<T> {
	const current = signal(initial);
	return {
		dirty: computed(() => !deepEqual(read(), current())),
		reset: (...args: [T?]) => {
			if (args.length) current.set(args[0] as T);
			restore(current.peek());
		},
	};
}