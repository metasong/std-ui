// "Touched" tracking: marked once the user leaves the control (`focusout`, which also fires for focus
// moving out of a descendant) or validation is reported (`invalid` event, i.e. `reportValidity()` or
// a submit attempt). Style errors only after that:
//   - form-associated custom elements (`FormElement`): `:state(touched):invalid` (via `internals.states`)
//   - native controls:                                  `[touched]:invalid`      (attribute)
// `:user-invalid` can't be used: `ElementInternals` has no way to set the "user interacted" flag.
//
// `markTouched` / `unmarkTouched` only show the flag on the element. Who decides it is touched:
//   - `formUi` state (via `formBind`): the state holds `touched`, `formBind` calls `onTouch` to set it;
//   - no state (`FormElement`, routed inner inputs): `trackTouched` marks the element itself.

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

/** Reverse of `markTouched`: clears the `touched` state / attribute. */
export function unmarkTouched(element: Element): void {
	const states = customStates(element);
	if (states) {
		try {
			states.delete('touched');
		} catch {
			// no `:state()` support: only the attribute exists
		}
	}
	element.removeAttribute('touched');
}

/**
 * Calls `onTouch` on `focusout` / `invalid` of `element`; returns a disposer. Not idempotent:
 * each call adds its own listeners.
 */
export function onTouch(element: Element, onTouch: () => void): () => void {
	element.addEventListener('focusout', onTouch);
	element.addEventListener('invalid', onTouch);
	return () => {
		element.removeEventListener('focusout', onTouch);
		element.removeEventListener('invalid', onTouch);
	};
}

/** Idempotent, never removed: the element marks itself touched. Safe to call on every render / error update. */
export function trackTouched(element: Element): void {
	if (tracked.has(element)) return;
	tracked.add(element);
	onTouch(element, () => markTouched(element));
}
