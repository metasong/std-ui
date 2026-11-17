// Radios in one group: choosing one unchecks its siblings *without* firing events on them, so their
// bindings would keep a stale model (still `true`). Each bound radio registers a "pull my live state
// into the model" callback; when one radio changes we ask its same-named siblings to run it.

const pullCallbacks = new WeakMap<Element, () => void>();

export function registerRadio(radio: HTMLInputElement, pull: () => void): void {
	pullCallbacks.set(radio, pull);
}

export function unregisterRadio(radio: Element): void {
	pullCallbacks.delete(radio);
}

export function pullRadioSiblings(radio: HTMLInputElement): void {
	if (!radio.name) return;
	const root = radio.form ?? (radio.getRootNode() as ParentNode);
	if (typeof root.querySelectorAll !== 'function') return;
	for (const other of root.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
		if (other !== radio && other.name === radio.name) pullCallbacks.get(other)?.();
	}
}
