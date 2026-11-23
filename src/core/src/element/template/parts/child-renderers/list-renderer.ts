import { ChildPart } from '../child-part.js';
import { ChildRenderer } from './child-renderer.js';

export class ListRenderer extends ChildRenderer<readonly unknown[]> {
	#items: ChildPart[] = [];
	update(values: readonly unknown[]): boolean {
		const items = this.#items;
		// Shrink: drop any items left over from a previously-longer list.
		while (items.length > values.length) items.pop()!.dispose();
		// Grow: each item gets its own anchor comment, inserted in order right before ours.
		while (items.length < values.length) {
			const itemAnchor = document.createComment('std-ui-part');
			this.anchor.before(itemAnchor);
			items.push(new ChildPart(itemAnchor, this.host));
		}
		for (let i = 0; i < values.length; i++) items[i].update([values[i]]);
		return true;
	}
	override disconnect(): void {
		for (const item of this.#items) item.disconnect();
	}
	override dispose(): void {
		for (const item of this.#items) item.dispose();
		this.#items = [];
	}
}
