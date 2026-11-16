import { applyDirective, isDirectiveResult, type Directive, type ElementPartInfo } from '../directive.js';
import { PartType, type Part } from './part.js';

/** <div ${directive()}>: an interpolation in an opening tag with no attribute name. Only
 *  directives (e.g. ref) make sense here; falsy values (cond && ref(r)) are ignored. */
export class ElementPart implements Part {
	readonly valueCount = 1;
	#directive: Directive | undefined;
	readonly #partInfo: ElementPartInfo;
	constructor(el: Element, host?: unknown) {
		this.#partInfo = { type: PartType.ELEMENT, element: el, host };
	}

	disconnect(): void {
		this.#directive?.disconnected();
		this.#directive = undefined;
	}

	update(values: readonly unknown[]): void {
		const value = values[0];
		if (isDirectiveResult(value)) {
			this.#directive = applyDirective(this.#partInfo, value, this.#directive).instance;
			return;
		}
		this.disconnect();
		if (value != null && value !== false) {
			throw new Error('std-ui html: an element binding (<tag ${...}>) only accepts directives, e.g. ref().');
		}
	}
}
