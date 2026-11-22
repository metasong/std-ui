import type { Validator } from '../../main.js';

/** Anything read as a tracked boolean: a `State<boolean>`, a `Computed<boolean>` or `() => boolean`. */
export type Enabled = () => boolean;

/**
 * Makes validators apply only while `enabled()` is true. Disabled: no errors, not pending, and the
 * wrapped validator is not called at all (so an async one starts no request). `enabled` is read
 * inside the node's computeds, so flipping it re-evaluates `errors` / `valid` / `pending`.
 *
 * - `null` / `undefined` means always enabled; a single validator is returned unchanged.
 * - Given an array, the result is one validator running them all.
 * - The `flag` tag of `required()` etc. is deliberately not kept: the constraint is conditional.
 */
export function when<T>(enabled: Enabled | null | undefined, validator: Validator<T>): Validator<T>;
export function when<T>(enabled: Enabled | null | undefined, validators: readonly Validator<T>[]): Validator<T>;
export function when<T>(
	enabled: Enabled | null | undefined,
	validators: Validator<T> | readonly Validator<T>[],
): Validator<T> {
	const list: readonly Validator<T>[] = Array.isArray(validators)
		? (validators as readonly Validator<T>[])
		: [validators as Validator<T>];
	if (!enabled && list.length === 1) return list[0];
	const on: Enabled = enabled ?? (() => true);

	const run: Validator<T> = (value) => {
		if (!on()) return null;
		const out: unknown[] = [];
		for (const v of list) {
			const r = v(value);
			if (!r) continue;
			if (Array.isArray(r)) out.push(...r);
			else out.push(r);
		}
		return out as never;
	};
	if (list.some((v) => v.pending)) {
		(run as { pending?: (value: T) => boolean }).pending = (value: T) => {
			if (!on()) return false;
			let any = false; // no early exit: each pending() also (re)starts that validator's request
			for (const v of list) if (v.pending?.(value)) any = true;
			return any;
		};
	}
	return run;
}
