import { describeTarget, isCheckableInput } from '../defaults.js';

/** DEV only, call as `if (DEV) assertBindableTarget(...)`: `.checked` on a plain <input> must be checkbox or radio. */
export function assertBindableTarget(element: Element, property: string): void {
	if (property === 'checked' && element instanceof HTMLInputElement && !isCheckableInput(element)) {
		throw new Error(`std-ui bind(): ${describeTarget(element, property)} requires type="checkbox" or type="radio".`);
	}
}
