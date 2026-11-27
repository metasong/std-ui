import { isWritableSignal } from '../../../../reactive/signal/index.js';

/** A signal-valued property is written through its `.set()`; plain assignment would replace the signal itself. */
export function writeProperty(element: Element, property: string, model: unknown): void {
	const target = element as unknown as Record<string, unknown>;
	const current = target[property];
	if (isWritableSignal(current) && current !== model) current.set(model as never);
	else target[property] = model;
}
