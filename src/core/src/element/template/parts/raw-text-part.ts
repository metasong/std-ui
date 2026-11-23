import { isDirectiveResult } from '../directives/directive.js';
import { DEV } from '../../../dev/flag.js';
import type { Part } from './part.js';

/** Static text of a `<title>`/`<textarea>` body is RCDATA: character references (`&amp;`) are decoded.
 *  `<style>`/`<script>` text is verbatim. */
function decodeRcdata(text: string): string {
	if (!text.includes('&')) return text;
	const el = document.createElement('textarea');
	el.innerHTML = text;
	return el.value;
}

/** `<title>a ${x} b ${y}</title>` / `<textarea>...</textarea>`: the body is plain text (not markup), so all
 *  its interpolations are joined with the static text into one string set as the element's `textContent`.
 *  `null`/`undefined` become `''`; everything else is stringified. Directives and nested templates are
 *  not supported here. */
export class RawTextPart implements Part {
	readonly valueCount: number;
	readonly #el: Element;
	readonly #literals: readonly string[];
	#last: string | undefined;

	constructor(el: Element, literals: readonly string[], valueCount: number) {
		this.#el = el;
		const rcdata = el.localName === 'title' || el.localName === 'textarea';
		this.#literals = rcdata ? literals.map(decodeRcdata) : literals;
		this.valueCount = valueCount;
	}

	update(values: readonly unknown[]): void {
		let text = this.#literals[0];
		for (let i = 0; i < this.valueCount; i++) {
			const value = values[i];
			if (isDirectiveResult(value)) {
				throw new Error(
					DEV
						? `std-ui html: directives are not supported inside <${this.#el.localName}>; its content is plain text.`
						: 'std-ui: no directives in text-only elements',
				);
			}
			text += (value == null ? '' : String(value)) + this.#literals[i + 1];
		}
		if (text === this.#last) return;
		this.#last = text;
		this.#el.textContent = text;
	}
}
