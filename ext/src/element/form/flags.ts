// Form UI flags shown on an element, so CSS can style them. Each flag is set as both:
//   - a `data-<flag>` attribute (any element, native controls included): `[data-touched]:invalid`
//   - a custom state (`FormElement`, via `internals.states`):             `:state(touched):invalid`
// Flags:
//   - `touched`: the user left the control (`focusout`, which also fires for focus moving out of a
//     descendant) or validation was reported (`invalid` event, i.e. `reportValidity()` or a submit
//     attempt). Style errors only after that. `:user-invalid` can't be used: `ElementInternals` has
//     no way to set the "user interacted" flag.
//   - `dirty`: the value differs from its initial value (from the `changes` state).
//   - `pending`: an async validator has not produced a result yet (from the `check` state).
//
// These only show the flag; callers decide when it is set:
//   - state (via `formBind`): `formUi.touched` / `changes.dirty` hold it, `formBind` shows it;
//   - no state (`FormElement` and its inner controls): `FormElement` listens on itself for touched.

export type FormFlag = 'touched' | 'dirty' | 'pending';

function customStates(element: Element): Set<string> | undefined {
	return (element as { internals?: { states?: Set<string> } }).internals?.states;
}

/** Shows (`on`) or clears the flag as `data-<flag>` and, where available, `:state(<flag>)`. */
export function setFlag(element: Element, flag: FormFlag, on: boolean): void {
	element.toggleAttribute(`data-${flag}`, on);
	try {
		const states = customStates(element);
		if (on) states?.add(flag);
		else states?.delete(flag);
	} catch {
		// Browser without `:state()` support (legacy `--flag` syntax): the attribute is enough.
	}
}