// "Touched" tracking: marked once the user leaves the control (`focusout`, which also fires for focus
// moving out of a descendant) or validation is reported (`invalid` event, i.e. `reportValidity()` or
// a submit attempt). Style errors only after that:
//   - form-associated custom elements (`FormElement`): `:state(touched):invalid` (via `internals.states`)
//   - native controls:                                  `[touched]:invalid`      (attribute)
// `:user-invalid` can't be used: `ElementInternals` has no way to set the "user interacted" flag.

const tracked = new WeakSet<Element>();

function customStates(element: Element): Set<string> | undefined {
	return (element as { internals?: { states?: Set<string> } }).internals?.states;
}

export function markTouched(element: Element): void {
	const states = customStates(element);
	if (states) {
		try {
			states.add('touched');
			return;
		} catch {
			// Browser without `:state()` support (legacy `--touched` syntax): fall back to the attribute.
		}
	}
	element.setAttribute('touched', '');
}

/** Idempotent: safe to call on every render / error update. */
export function trackTouched(element: Element): void {
	if (tracked.has(element)) return;
	tracked.add(element);
	const mark = () => markTouched(element);
	element.addEventListener('focusout', mark);
	element.addEventListener('invalid', mark);
}
