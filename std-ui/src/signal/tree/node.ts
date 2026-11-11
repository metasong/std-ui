// Shared contract between the tree's container nodes (`./array`, `./object`) and their children.

import { computed, signal, type Computed, type Signal } from '../core/index.js';

export interface ValidationError {
	kind: string;
	message: string;
}

/** An error plus where it came from, relative to the node it was read from ([] = the node itself). */
export interface PathError extends ValidationError {
	path: (string | number)[];
}

/** Returns the error(s) for `value`, or nothing when it is valid. Runs on plain (raw) values. */
export type Validator<T> = (value: T) => ValidationError | readonly ValidationError[] | null | undefined | void;

/** Validation members, grouped under `node.check` on every tree node. Reads of the node itself stay plain `T`. */
export interface Validation<T> {
	/** Validators for this node's own value; replace them with `validators.set([...])`. */
	readonly validators: Signal<Validator<T>[]>;
	/** Tracked errors from this node's own validators only (`[]` when valid). */
	readonly errors: Computed<ValidationError[]>;
	/**
	 * Tracked; true when this node and every descendant has no errors. Same as
	 * `allErrors().length === 0`, but cheaper (stops at the first error, builds no list) and only
	 * notifies when the boolean flips, not on every error change.
	 */
	readonly valid: Computed<boolean>;
	/** Tracked; errors of this node and all descendants, each with its path below this node.
	 * Post-order: each child's subtree (deepest first), then this node's own errors. */
	readonly allErrors: Computed<PathError[]>;
}

/** Mixin carried by every tree node: its validation members under check. */
export interface Checked<T> {
	readonly check: Validation<T>;
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
	check?: { valid: () => boolean; allErrors: () => PathError[] };
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
	const valid = computed(() => {
		if (errors().length) return false;
		for (const [, child] of children()) if (child.check && !child.check.valid()) return false;
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
	return { validators, errors, valid, allErrors };
}

