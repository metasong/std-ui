import { ChildRenderer } from './child-renderer.js';

export class TextRenderer extends ChildRenderer<string> {
	#node: Text | undefined;
	update(text: string): boolean {
		if (this.#node) {
			if (this.#node.data !== text) this.#node.data = text;
		} else {
			this.#node = document.createTextNode(text);
			this.anchor.before(this.#node);
		}
		return true;
	}
	dispose(): void {
		this.#node?.remove();
	}
}
