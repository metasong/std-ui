import { ChildPart } from '../../parts/child-part.js';
import { Committer } from '../../parts/committers/committer.js';

export type MapByKeyEntries = ReadonlyArray<{ readonly key: unknown; readonly value: unknown }>;

/** One item: its DOM lives between `start` and `part.endNode` (inclusive). */
interface KeyedItem {
	start: Comment;
	part: ChildPart;
}

function removeKeyed(item: KeyedItem): void {
	item.part.dispose();
	item.start.remove();
}

export class MapByKeyCommitter extends Committer<MapByKeyEntries> {
	#items = new Map<unknown, KeyedItem>();
	update(entries: MapByKeyEntries): boolean {
		const old = this.#items;
		const next = new Map<unknown, KeyedItem>();

		// Remove items whose keys disappeared.
		const newKeys = new Set(entries.map((e) => e.key));
		for (const [key, item] of old) if (!newKeys.has(key)) removeKeyed(item);

		// Walk backwards so each item only needs to be placed before the one after it.
		let ref: Node = this.anchor;
		for (let i = entries.length - 1; i >= 0; i--) {
			const { key, value } = entries[i];
			let item = old.get(key);
			if (!item) {
				const start = document.createComment('std-ui-part');
				const end = document.createComment('std-ui-part');
				ref.parentNode!.insertBefore(start, ref);
				ref.parentNode!.insertBefore(end, ref);
				item = { start, part: new ChildPart(end) };
			} else if (item.part.endNode.nextSibling !== ref) {
				// Existing item out of place: move its whole [start..end] range before `ref`.
				const parent = ref.parentNode!;
				const range: Node[] = [];
				for (let n: Node | null = item.start; n; n = n.nextSibling) {
					range.push(n);
					if (n === item.part.endNode) break;
				}
				for (const n of range) parent.insertBefore(n, ref);
			}
			item.part.update([value]);
			next.set(key, item);
			ref = item.start;
		}
		this.#items = next;
		return true;
	}
	override disconnect(): void {
		for (const item of this.#items.values()) item.part.disconnect();
	}
	dispose(): void {
		for (const item of this.#items.values()) removeKeyed(item);
		this.#items.clear();
	}
}
