import type { TemplateResult } from '../../tag-funcs/html/index.js';
import { getTemplate, instantiate } from '../../compiler/index.js';
import { type Part, updateParts } from '../part.js';
import { ChildRenderer } from './child-renderer.js';

export class TemplateRenderer extends ChildRenderer<TemplateResult> {
	#strings: TemplateStringsArray | undefined;
	#parts: Part[] = [];
	#nodes: ChildNode[] = [];
	update(result: TemplateResult): boolean {
		if (this.#strings) {
			if (this.#strings !== result.strings) return false;
			updateParts(this.#parts, result.values);
			return true;
		}
		const { fragment, parts } = instantiate(getTemplate(result.strings, result.type), this.host);
		this.#nodes = Array.from(fragment.childNodes);
		this.anchor.before(fragment);
		updateParts(parts, result.values);
		this.#strings = result.strings;
		this.#parts = parts;
		return true;
	}
	override disconnect(): void {
		for (const p of this.#parts) p.disconnect?.();
	}
	override dispose(): void {
		this.disconnect();
		for (const n of this.#nodes) n.remove();
	}
}
