import type { TemplateResult } from '../../html.js';
import { getTemplate, instantiate } from '../../compiler/index.js';
import { type Part, updateParts } from '../core.js';
import { Committer } from './committer.js';

export class TemplateCommitter extends Committer<TemplateResult> {
	#strings: TemplateStringsArray | undefined;
	#parts: Part[] = [];
	#nodes: ChildNode[] = [];
	update(result: TemplateResult): boolean {
		if (this.#strings) {
			if (this.#strings !== result.strings) return false;
			updateParts(this.#parts, result.values);
			return true;
		}
		const { fragment, parts } = instantiate(getTemplate(result.strings, result.type));
		this.#nodes = Array.from(fragment.childNodes);
		this.anchor.before(fragment);
		updateParts(parts, result.values);
		this.#strings = result.strings;
		this.#parts = parts;
		return true;
	}
	disconnect(): void {
		for (const p of this.#parts) p.disconnect?.();
	}
	dispose(): void {
		this.disconnect();
		for (const n of this.#nodes) n.remove();
	}
}
