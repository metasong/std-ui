// Pure fixed-size grid math for `virtualize`. No DOM access.

export interface GridMetrics {
	count: number;
	columns: number;
	/** Height of one row of items. */
	itemHeight: number;
	/** Gap between rows (and columns, handled by CSS). */
	gap: number;
}

export interface Window {
	/** First rendered item index (inclusive), always a multiple of `columns`. */
	start: number;
	/** Last rendered item index (exclusive). */
	end: number;
	/** First / last rendered row (end exclusive). */
	startRow: number;
	endRow: number;
}

export const rowCount = (m: GridMetrics): number => Math.ceil(m.count / m.columns);
const stride = (m: GridMetrics): number => m.itemHeight + m.gap;

/** Total content height of the whole list. */
export function totalHeight(m: GridMetrics): number {
	const rows = rowCount(m);
	return rows === 0 ? 0 : rows * stride(m) - m.gap;
}

/** Offset of the top edge of `row` from the top of the list. */
export const rowOffset = (m: GridMetrics, row: number): number => row * stride(m);

/**
 * Items to render for a viewport covering `[offset, offset + viewport)` (relative to list top),
 * widened by `overscan` rows on each side.
 */
export function computeWindow(m: GridMetrics, offset: number, viewport: number, overscan: number): Window {
	const rows = rowCount(m);
	if (rows === 0) return { start: 0, end: 0, startRow: 0, endRow: 0 };
	const s = stride(m);
	const first = Math.floor(Math.max(0, offset) / s);
	const last = Math.ceil(Math.max(0, offset + viewport) / s); // exclusive
	const startRow = Math.min(rows - 1, Math.max(0, first - overscan));
	const endRow = Math.min(rows, Math.max(startRow + 1, last + overscan));
	return {
		start: startRow * m.columns,
		end: Math.min(m.count, endRow * m.columns),
		startRow,
		endRow,
	};
}

/** Height of the spacer standing in for `rows` hidden rows next to a visible neighbour (one `gap`
 *  already separates the spacer from it). 0 means no spacer needed. */
export function spacerHeight(m: GridMetrics, rows: number): number {
	return rows <= 0 ? 0 : Math.max(0, rows * stride(m) - m.gap);
}

export type ScrollAlign = 'start' | 'center' | 'end' | 'nearest';

/** Target scroll offset (relative to list top) that brings `index` into view. */
export function scrollTarget(
	m: GridMetrics,
	index: number,
	align: ScrollAlign,
	currentOffset: number,
	viewport: number,
): number {
	const i = Math.min(Math.max(0, index), Math.max(0, m.count - 1));
	const top = rowOffset(m, Math.floor(i / m.columns));
	const bottom = top + m.itemHeight;
	switch (align) {
		case 'start':
			return top;
		case 'center':
			return top - (viewport - m.itemHeight) / 2;
		case 'end':
			return bottom - viewport;
		case 'nearest':
			if (top < currentOffset) return top;
			if (bottom > currentOffset + viewport) return bottom - viewport;
			return currentOffset;
	}
}
