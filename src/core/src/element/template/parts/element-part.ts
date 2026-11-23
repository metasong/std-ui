import { DirectiveSlot, isDirectiveResult, type ElementPartInfo } from '../directives/directive.js';
import { PartType, type Part } from './part.js';
import { DEV } from '../../../dev/flag.js';
import { usageError } from '../../../util.js';

/** <div ${directive()}>: an interpolation in an opening tag with no attribute name. Only
 *  directives (e.g. ref) make sense here; falsy values (cond && ref(r)) are ignored. */
export class ElementPart implements Part {
	readonly valueCount = 1;
	readonly #slot = new DirectiveSlot();
	readonly #partInfo: ElementPartInfo;
	constructor(el: Element, host?: unknown) {
		this.#partInfo = { type: PartType.ELEMENT, element: el, host };
	}

	disconnect(): void {
		this.#slot.disconnect();
	}

	update(values: readonly unknown[]): void {
		const value = values[0];
		if (isDirectiveResult(value)) {
			this.#slot.apply(this.#partInfo, value);
			return;
		}
		this.disconnect();
		if (value != null && value !== false) {
			throw usageError(DEV && 'std-ui html: an element binding (<tag ${...}>) only accepts directives, e.g. ref().', 'element binding');
		}
	}
}
