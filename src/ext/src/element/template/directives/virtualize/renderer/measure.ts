// Reading real sizes/positions back from the DOM into the `RowModel`.

import type { KeyedRows } from '@std-ui/core';
import type { RowModel, Window as ItemWindow } from '../layout.js';
import type { Axis, Scroller } from './axis.js';

export interface MeasureWindowParams {
	axis: Axis;
	model: RowModel;
	rows: KeyedRows;
	win: ItemWindow;
	lanes: number;
	count: number;
	keyOf: (index: number) => unknown;
	/** Receives every element that was measured (for resize observation). */
	seen: Set<Element>;
}

/** Measure each windowed row (as tall as its largest item). Returns true if any size changed. */
export function measureWindowRows(p: MeasureWindowParams): boolean {
	let changed = false;
	for (let r = p.win.startRow; r < p.win.endRow; r++) {
		let rowSize = 0;
		for (let i = r * p.lanes; i < Math.min(p.count, (r + 1) * p.lanes); i++) {
			rowSize = Math.max(rowSize, p.axis.extent(p.rows.elements(p.keyOf(i)), p.seen));
		}
		if (rowSize > 0 && p.model.setHeight(r, rowSize)) changed = true;
	}
	return changed;
}

/** Measure the pinned header (it lives outside the window but still has a real size). */
export function measurePinned(
	axis: Axis,
	model: RowModel,
	pinned: KeyedRows,
	index: number,
	key: unknown,
	seen: Set<Element>,
): boolean {
	const size = axis.extent(pinned.elements(key), seen);
	return size > 0 && model.setHeight(index, size);
}

/**
 * Without an explicit estimate, unmeasured rows assume the mean of the measured ones. Returns the
 * new estimate (already applied to `model`) if it moved, else undefined.
 */
export function updateAutoEstimate(model: RowModel, current: number): number | undefined {
	const avg = model.measuredAverage();
	if (avg === undefined || Math.abs(avg - current) < 0.5) return undefined;
	model.configure(avg, model.gap, model.rows);
	return avg;
}

export interface ListTopParams {
	axis: Axis;
	scroller: Scroller;
	model: RowModel;
	rows: KeyedRows;
	win: ItemWindow;
	lanes: number;
	items: ArrayLike<unknown>;
	isHeader: ((item: any, index: number) => boolean) | undefined;
	keyOf: (index: number) => unknown;
}

/**
 * The list's leading edge in scroller content coordinates, derived from the first rendered row.
 * Skips header rows: a stuck header's rect is shifted by `position: sticky`. Undefined if nothing
 * measurable is rendered.
 */
export function measureListTop(p: ListTopParams): number | undefined {
	if (p.win.end === p.win.start) return undefined;
	let i = p.win.start;
	while (i < p.win.end - 1 && p.isHeader?.(p.items[i], i)) i++;
	const first = p.rows.elements(p.keyOf(i))[0];
	if (!first) return undefined;
	return p.axis.contentPos(first, p.scroller) - p.model.offset(Math.floor(i / p.lanes));
}
