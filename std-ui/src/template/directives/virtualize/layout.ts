// Row-offset model and window math for `virtualize`. No DOM access.
//
// Rows have an estimated height until measured. With no measurements (fixed-height mode) offsets
// are plain arithmetic; once any row is measured, a lazily rebuilt prefix-sum array is used.

export class RowModel {
	#rows = 0;
	#heights: Float64Array | undefined;
	#prefix: Float64Array | undefined; // prefix[r] = offset of row r; length rows + 1
	#sum = 0;
	#count = 0;
	#valid = 0; // prefix[0..#valid] are up to date
	constructor(
		/** Height assumed for unmeasured rows. */
		public estimate: number,
		public gap: number,
	) {}

	get rows(): number {
		return this.#rows;
	}

	configure(estimate: number, gap: number, rows: number): void {
		if (estimate !== this.estimate || gap !== this.gap) {
			this.estimate = estimate;
			this.gap = gap;
			this.#invalidate(0);
		}
		if (rows !== this.#rows) {
			const old = this.#heights;
			this.#rows = rows;
			if (old) {
				const next = new Float64Array(rows);
				next.set(old.subarray(0, Math.min(old.length, rows)));
				this.#heights = next;
				this.#recount();
			}
			this.#prefix = undefined;
			this.#invalidate(0);
		}
	}

	/** Record a measured height. Returns true if it changed the layout. */
	setHeight(row: number, height: number): boolean {
		if (row < 0 || row >= this.#rows) return false;
		if (!this.#heights) this.#heights = new Float64Array(this.#rows);
		const measured = this.#heights[row];
		const old = measured || this.estimate;
		if (measured) this.#sum += height - measured;
		else {
			this.#sum += height;
			this.#count++;
		}
		if (Math.abs(old - height) < 0.5) {
			if (!measured) this.#heights[row] = height; // remember it, layout unchanged
			return false;
		}
		this.#heights[row] = height;
		this.#invalidate(row);
		return true;
	}

	/** Mean of measured row heights, or undefined if nothing is measured yet. */
	measuredAverage(): number | undefined {
		return this.#count > 0 ? this.#sum / this.#count : undefined;
	}

	#recount(): void {
		this.#sum = 0;
		this.#count = 0;
		for (const h of this.#heights ?? []) {
			if (h) {
				this.#sum += h;
				this.#count++;
			}
		}
	}

	height(row: number): number {
		return this.#heights?.[row] || this.estimate;
	}

	#invalidate(from: number): void {
		this.#valid = Math.min(this.#valid, from);
	}

	#build(upTo: number): Float64Array {
		const heights = this.#heights;
		const prefix = (this.#prefix ??= new Float64Array(this.#rows + 1));
		for (let r = this.#valid; r < upTo; r++) {
			prefix[r + 1] = prefix[r] + (heights?.[r] || this.estimate) + this.gap;
		}
		this.#valid = Math.max(this.#valid, upTo);
		return prefix;
	}

	/** Offset of the top edge of `row` (row === rows gives total + gap). */
	offset(row: number): number {
		const r = Math.min(Math.max(0, row), this.#rows);
		if (!this.#heights) return r * (this.estimate + this.gap);
		return this.#build(r)[r];
	}

	/** Content height of the whole list. */
	total(): number {
		return this.#rows === 0 ? 0 : this.offset(this.#rows) - this.gap;
	}

	/** Row containing `offset` (clamped to valid rows). */
	rowAt(offset: number): number {
		if (this.#rows === 0) return 0;
		if (!this.#heights) {
			return Math.min(this.#rows - 1, Math.max(0, Math.floor(offset / (this.estimate + this.gap))));
		}
		const prefix = this.#build(this.#rows);
		let lo = 0;
		let hi = this.#rows - 1;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if (prefix[mid] <= offset) lo = mid;
			else hi = mid - 1;
		}
		return lo;
	}
}

export interface Window {
	/** First rendered item index (inclusive), always a multiple of `lanes`. */
	start: number;
	/** Last rendered item index (exclusive). */
	end: number;
	startRow: number;
	/** Exclusive. */
	endRow: number;
}

export const rowCount = (count: number, lanes: number): number => Math.ceil(count / lanes);

/** Items to render for a viewport covering `[offset, offset + viewport)` (relative to list top),
 *  widened by `overscan` rows on each side. */
export function computeWindow(
	model: RowModel,
	count: number,
	lanes: number,
	offset: number,
	viewport: number,
	overscan: number,
): Window {
	const rows = model.rows;
	if (rows === 0) return { start: 0, end: 0, startRow: 0, endRow: 0 };
	const off = Math.max(0, offset);
	const first = model.rowAt(off);
	const last = model.rowAt(off + Math.max(0, viewport - 1e-6)); // inclusive; viewport end is exclusive
	const startRow = Math.min(rows - 1, Math.max(0, first - overscan));
	const endRow = Math.min(rows, Math.max(startRow + 1, last + 1 + overscan));
	return { start: startRow * lanes, end: Math.min(count, endRow * lanes), startRow, endRow };
}

/** Height of the spacer standing in for rows `[from, to)` next to a visible neighbour (one `gap`
 *  already separates the spacer from it). 0 means no spacer needed. */
export function spacerSize(model: RowModel, from: number, to: number): number {
	if (to <= from) return 0;
	return Math.max(0, model.offset(to) - model.offset(from) - model.gap);
}

export type ScrollAlign = 'start' | 'center' | 'end' | 'nearest';

/** Target scroll offset (relative to list top) that brings `index`'s row into view. */
export function scrollTarget(
	model: RowModel,
	count: number,
	lanes: number,
	index: number,
	align: ScrollAlign,
	currentOffset: number,
	viewport: number,
): number {
	const i = Math.min(Math.max(0, index), Math.max(0, count - 1));
	const row = Math.floor(i / lanes);
	const top = model.offset(row);
	const height = model.height(row);
	const bottom = top + height;
	switch (align) {
		case 'start':
			return top;
		case 'center':
			return top - (viewport - height) / 2;
		case 'end':
			return bottom - viewport;
		case 'nearest':
			if (top < currentOffset) return top;
			if (bottom > currentOffset + viewport) return bottom - viewport;
			return currentOffset;
	}
}
