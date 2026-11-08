import { ChildPart } from '../parts/child-part.js';

export type KeyedEntries = ReadonlyArray<{ readonly key: unknown; readonly value: unknown }>;

/** One row: its DOM lives between `start` and `part.endNode` (inclusive). */
interface KeyedRow {
	start: Comment;
	part: ChildPart;
}

function removeRow(row: KeyedRow): void {
	row.part.dispose();
	row.start.remove();
}

/**
 * Keyed DOM reconciliation shared by `mapByKey` and `virtualize`. Rows are inserted before
 * `anchor` (any node with a parent), each wrapped in a comment-delimited range with its own
 * `ChildPart`.
 */
export class KeyedRows {
	#rows = new Map<unknown, KeyedRow>();
	constructor(readonly anchor: Node) {}

	has(key: unknown): boolean {
		return this.#rows.has(key);
	}

	/**
	 * Reconcile to `entries` (in order). If `shouldUpdate` is given, rows for which it returns false
	 * are placed but their value is not re-applied (used by `virtualize` on scroll).
	 */
	update(entries: KeyedEntries, shouldUpdate?: (key: unknown) => boolean): void {
		const old = this.#rows;
		const next = new Map<unknown, KeyedRow>();

		const newKeys = new Set(entries.map((e) => e.key));
		for (const [key, row] of old) if (!newKeys.has(key)) removeRow(row);

		// Walk backwards so each row only needs to be placed before the one after it.
		let ref: Node = this.anchor;
		for (let i = entries.length - 1; i >= 0; i--) {
			const { key, value } = entries[i];
			let row = old.get(key);
			let apply = true;
			if (!row) {
				const start = document.createComment('std-ui-part');
				const end = document.createComment('std-ui-part');
				ref.parentNode!.insertBefore(start, ref);
				ref.parentNode!.insertBefore(end, ref);
				row = { start, part: new ChildPart(end) };
			} else {
				if (row.part.endNode.nextSibling !== ref) {
					const parent = ref.parentNode!;
					const range: Node[] = [];
					for (let n: Node | null = row.start; n; n = n.nextSibling) {
						range.push(n);
						if (n === row.part.endNode) break;
					}
					for (const n of range) parent.insertBefore(n, ref);
				}
				if (shouldUpdate && !shouldUpdate(key)) apply = false;
			}
			if (apply) row.part.update([value]);
			next.set(key, row);
			ref = row.start;
		}
		this.#rows = next;
	}

	disconnect(): void {
		for (const row of this.#rows.values()) row.part.disconnect();
	}

	dispose(): void {
		for (const row of this.#rows.values()) removeRow(row);
		this.#rows.clear();
	}
}
