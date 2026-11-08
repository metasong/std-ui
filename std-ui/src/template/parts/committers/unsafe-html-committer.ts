import { Committer } from './committer.js';

export class UnsafeHtmlCommitter extends Committer<string> {
	#markup: string | undefined;
	#nodes: ChildNode[] = [];
	update(markup: string): boolean {
		if (this.#markup === markup) return true;
		this.dispose();
		const container = document.createElement('template');
		container.innerHTML = markup;
		this.#nodes = Array.from(container.content.childNodes);
		this.anchor.before(container.content);
		this.#markup = markup;
		return true;
	}
	dispose(): void {
		for (const n of this.#nodes) n.remove();
		this.#nodes = [];
	}
}
