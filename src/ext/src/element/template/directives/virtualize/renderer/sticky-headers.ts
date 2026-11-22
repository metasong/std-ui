import { KeyedRows } from '../../_lib/keyed-rows/index.js';
import type { Window as ItemWindow } from '../layout.js';
import type { VirtualizeOptions } from '../options.js';
import type { Axis } from './axis.js';

/**
 * Sticky section headers (lanes = 1). Headers get `position: sticky` in place. When the active
 * header (the last one at or before the first visible row) has scrolled out of the window, it is
 * additionally rendered as the *pinned* row, before the top spacer, and the spacer shrinks by its
 * size so the layout stays consistent.
 */
export class StickyHeaders {
	/** Holds the pinned header. Inserted before `anchor` (the top spacer). */
	readonly pinned: KeyedRows;
	pinnedIndex: number | undefined;
	pinnedKey: unknown;
	#cache: { items: ArrayLike<unknown>; length: number; indices: number[] } | undefined;

	constructor(anchor: Node, host?: unknown) {
		this.pinned = new KeyedRows(anchor, host);
	}

	/** Indices of header items, cached per `items` array (identity + length). */
	headers(items: ArrayLike<unknown>, isHeader: ((item: any, i: number) => boolean) | undefined): number[] | undefined {
		if (!isHeader) return undefined;
		const c = this.#cache;
		if (c && c.items === items && c.length === items.length) return c.indices;
		const indices: number[] = [];
		for (let i = 0; i < items.length; i++) if (isHeader(items[i], i)) indices.push(i);
		this.#cache = { items, length: items.length, indices };
		return indices;
	}

	/** Index of the last header at or before `row` (lanes = 1: row === index), if any. */
	activeHeader(headers: number[] | undefined, row: number): number | undefined {
		if (!headers) return undefined;
		let lo = 0;
		let hi = headers.length - 1;
		let found: number | undefined;
		while (lo <= hi) {
			const mid = (lo + hi) >> 1;
			if (headers[mid] <= row) {
				found = headers[mid];
				lo = mid + 1;
			} else hi = mid - 1;
		}
		return found;
	}

	/** Render/remove the pinned header and make headers inside the window sticky. */
	render(p: {
		axis: Axis;
		items: ArrayLike<unknown>;
		options: VirtualizeOptions<any>;
		keyOf: (index: number) => unknown;
		rows: KeyedRows; // window rows
		win: ItemWindow;
		active: number | undefined;
		full: boolean;
	}): void {
		const { items, options, keyOf, win, active, full } = p;
		const pin = active !== undefined && active < win.start ? active : undefined;
		if (pin === undefined) {
			if (this.pinnedIndex !== undefined) this.pinned.update([]);
			this.pinnedIndex = undefined;
		} else {
			const key = keyOf(pin);
			const isNew = !this.pinned.has(key);
			this.pinned.update([{ key, value: full || isNew ? options.renderItem(items[pin], pin) : undefined }], () => full);
			this.pinnedIndex = pin;
			this.pinnedKey = key;
			this.#stick(p.axis, this.pinned, key);
		}
		const headers = this.headers(items, options.isHeader);
		if (!headers) return;
		let lo = 0;
		let hi = headers.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (headers[mid] < win.start) lo = mid + 1;
			else hi = mid;
		}
		for (let k = lo; k < headers.length && headers[k] < win.end; k++) this.#stick(p.axis, p.rows, keyOf(headers[k]));
	}

	disconnect(): void {
		this.pinned.disconnect();
	}

	dispose(): void {
		this.pinned.dispose();
		this.pinnedIndex = undefined;
	}

	#stick(axis: Axis, rows: KeyedRows, key: unknown): void {
		for (const el of rows.elements(key) as HTMLElement[]) {
			el.style.position = 'sticky';
			el.style[axis.side] = '0';
			el.style.zIndex = '1';
		}
	}
}
