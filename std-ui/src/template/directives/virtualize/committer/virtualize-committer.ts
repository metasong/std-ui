import { Committer } from '../../../parts/committers/committer.js';
import { KeyedRows, type KeyedEntries } from '../../keyed-rows/index.js';
import type { ControllerTarget, ScrollToIndexOptions, VirtualizeController } from '../controller.js';
import {
	computeWindow,
	rowCount,
	RowModel,
	scrollTarget,
	spacerSize,
	type Window as ItemWindow,
} from '../layout.js';
import type { VirtualizeValue } from '../options.js';
import { Axis } from './axis.js';
import { measureListTop, measurePinned, measureWindowRows, updateAutoEstimate } from './measure.js';
import { ScrollerBinding } from './scroller-binding.js';
import { Spacers } from './spacers.js';
import { StickyHeaders } from './sticky-headers.js';

interface Grid {
	count: number;
	lanes: number;
}

/**
 * Orchestrates one `virtualize()` binding. The pieces it coordinates:
 *
 * - `RowModel` (../layout.ts): row offsets/sizes, estimated until measured.
 * - `Axis`: all vertical-vs-horizontal differences.
 * - `ScrollerBinding`: scroll/resize listeners.
 * - `Spacers`: the two stand-ins for hidden rows.
 * - `KeyedRows`: the rendered window.
 * - `StickyHeaders`: the pinned header row, if `isHeader` is set.
 * - measure.ts: reading sizes/positions back from the DOM.
 */
export class VirtualizeCommitter extends Committer<VirtualizeValue> implements ControllerTarget {
	#value!: VirtualizeValue;
	#axis = new Axis(false);
	#model = new RowModel(1, 0);
	#rows!: KeyedRows;
	#spacers!: Spacers;
	#sticky!: StickyHeaders;
	#binding = new ScrollerBinding(this.anchor, {
		scroll: () => this.#refresh(false),
		resize: () => this.#refresh(false),
		rowResize: () => this.#refresh(false, true),
	});
	#controller: VirtualizeController | undefined;
	#pendingScroll: [number, ScrollToIndexOptions] | undefined;
	#disposed = false;

	/** The list's leading edge in scroller content coordinates (re-measured after each render). */
	#listTop = 0;
	/** Estimate used in variable mode when `estimatedItemSize` isn't given: mean of measured rows. */
	#autoEstimate = 40;
	#lanesNow = 1;
	#signature = '';

	// --- Committer protocol --------------------------------------------------------------------

	update(value: VirtualizeValue): boolean {
		this.#value = value;
		this.#axis = new Axis(value.options.direction === 'horizontal');
		if (!this.#rows) {
			this.#spacers = new Spacers(this.anchor, value.options.spacerTag ?? 'div', this.#axis);
			this.#rows = new KeyedRows(this.#spacers.bottom);
			this.#sticky = new StickyHeaders(this.#spacers.top);
		}
		const controller = value.options.controller;
		if (controller !== this.#controller) {
			this.#controller?._attach(undefined);
			this.#controller = controller;
		}
		this.#ensureAttached();
		this.#refresh(true);
		this.#controller?._attach(this);
		if (this.#pendingScroll && this.#binding.scroller) {
			const [i, o] = this.#pendingScroll;
			this.#pendingScroll = undefined;
			this.scrollToIndex(i, o);
		}
		return true;
	}

	override disconnect(): void {
		this.#binding.detach();
		this.#rows?.disconnect();
		this.#sticky?.disconnect();
	}

	dispose(): void {
		this.#disposed = true;
		this.#binding.detach();
		this.#controller?._attach(undefined);
		this.#controller = undefined;
		this.#rows?.dispose();
		this.#sticky?.dispose();
		this.#spacers?.remove();
	}

	// --- scrollToIndex -------------------------------------------------------------------------

	scrollToIndex(index: number, options: ScrollToIndexOptions = {}): void {
		this.#ensureAttached();
		const scroller = this.#binding.scroller;
		if (!scroller) {
			this.#pendingScroll = [index, options];
			return;
		}
		const target = (): number => {
			const g = this.#sync();
			const offset = this.#scrollPos() - this.#listTop;
			const rel = scrollTarget(this.#model, g.count, g.lanes, index, options.align ?? 'start', offset, this.#viewport());
			return Math.max(0, rel + this.#listTop);
		};
		if (options.behavior === 'smooth') {
			this.#axis.smoothScrollTo(scroller, target()); // the window follows via scroll events
			return;
		}
		// Instant. In variable-size mode, rendering the target region measures real sizes and moves
		// the target, so iterate until it settles (one pass in fixed mode).
		let pos = target();
		for (let pass = 0; pass < 6; pass++) {
			this.#axis.setScrollPos(scroller, pos);
			this.#refresh(false, true);
			const next = target();
			// Settled only if the target stopped moving AND anchoring didn't push scroll off it.
			if (Math.abs(next - pos) < 1 && Math.abs(this.#scrollPos() - next) < 1) break;
			pos = next;
		}
	}

	// --- refresh loop --------------------------------------------------------------------------

	/**
	 * Bring the DOM in line with the current scroll position and data.
	 * `full`: parent re-rendered, so re-run `renderItem` for every windowed item.
	 * `force`: reconcile/measure even if the window is unchanged (row sizes may have changed).
	 */
	#refresh(full: boolean, force = false): void {
		if (this.#disposed || !this.#rows || !this.#value) return;
		for (let pass = 0; pass < 4; pass++) {
			const g = this.#sync();
			// Anchor on the first visible row so measuring rows above it doesn't make content jump.
			const anchorRow = this.#binding.scroller ? this.#model.rowAt(this.#scrollPos() - this.#listTop) : 0;
			const anchorOffset = this.#model.offset(anchorRow);
			const win = this.#window(g);
			const active = this.#activeHeader();
			const sig = `${active}:${win.start}:${win.end}:${g.lanes}:${g.count}:${this.#model.estimate}:${this.#model.gap}`;
			if (!full && !force && sig === this.#signature) return;
			this.#signature = sig;

			this.#render(win, full, active);
			const measured = this.#isVariable() && this.#measure(win, g);
			if (measured) this.#applySpacers(win);

			let moved = this.#updateListTop(win, g);
			if (measured && this.#binding.scroller) {
				const delta = this.#model.offset(anchorRow) - anchorOffset;
				if (Math.abs(delta) >= 0.5) {
					this.#axis.setScrollPos(this.#binding.scroller, this.#scrollPos() + delta);
					moved = true;
				}
			}
			if (!moved && !measured) return;
			full = false; // settle again against the corrected layout
			force = true;
		}
	}

	#render(win: ItemWindow, full: boolean, active: number | undefined): void {
		const { items, options } = this.#value;
		const rows = this.#rows;
		const seen = new Set<unknown>();
		const entries: { key: unknown; value: unknown }[] = [];
		for (let i = win.start; i < win.end; i++) {
			const key = this.#keyOf(i);
			if (seen.has(key)) throw new Error(`std-ui virtualize(): duplicate key ${String(key)}.`);
			seen.add(key);
			entries.push({ key, value: full || !rows.has(key) ? options.renderItem(items[i], i) : undefined });
		}
		rows.update(entries as KeyedEntries, () => full);
		this.#sticky.render({ axis: this.#axis, items, options, keyOf: (i) => this.#keyOf(i), rows, win, active, full });
		this.#applySpacers(win);
	}

	#applySpacers(win: ItemWindow): void {
		const m = this.#model;
		let top: number;
		const pinned = this.#sticky.pinnedIndex;
		if (pinned !== undefined) {
			// The pinned header takes layout space itself (size + gap), so the spacer shrinks by that.
			const hidden = m.offset(win.startRow) - m.height(pinned) - m.gap;
			top = hidden > 0 ? hidden - m.gap : 0;
		} else {
			top = spacerSize(m, 0, win.startRow);
		}
		this.#spacers.setTop(top);
		this.#spacers.setBottom(spacerSize(m, win.endRow, m.rows));
	}

	// --- measuring -----------------------------------------------------------------------------

	/** Variable-size mode: read real sizes into the model. Returns true if the layout changed. */
	#measure(win: ItemWindow, g: Grid): boolean {
		const seen = new Set<Element>();
		let changed = measureWindowRows({
			axis: this.#axis,
			model: this.#model,
			rows: this.#rows,
			win,
			lanes: g.lanes,
			count: g.count,
			keyOf: (i) => this.#keyOf(i),
			seen,
		});
		const pinned = this.#sticky.pinnedIndex;
		if (pinned !== undefined) {
			if (measurePinned(this.#axis, this.#model, this.#sticky.pinned, pinned, this.#sticky.pinnedKey, seen)) changed = true;
		}
		this.#binding.syncRows(seen);
		if (this.#value.options.estimatedItemSize === undefined) {
			const estimate = updateAutoEstimate(this.#model, this.#autoEstimate);
			if (estimate !== undefined) {
				this.#autoEstimate = estimate;
				changed = true;
			}
		}
		return changed;
	}

	/** Re-measure the list's leading edge. Returns true if it moved. */
	#updateListTop(win: ItemWindow, g: Grid): boolean {
		const scroller = this.#binding.scroller;
		if (!scroller) return false;
		const { items, options } = this.#value;
		const top = measureListTop({
			axis: this.#axis,
			scroller,
			model: this.#model,
			rows: this.#rows,
			win,
			lanes: g.lanes,
			items,
			isHeader: options.isHeader,
			keyOf: (i) => this.#keyOf(i),
		});
		if (top === undefined) return false;
		const moved = Math.abs(top - this.#listTop) >= 0.5;
		this.#listTop = top;
		return moved;
	}

	// --- model & window ------------------------------------------------------------------------

	/** Push current options/data into the row model; returns the grid shape. */
	#sync(): Grid {
		const { options, items } = this.#value;
		const lanes = this.#lanes();
		this.#lanesNow = lanes;
		const estimate = options.itemSize ?? options.estimatedItemSize ?? this.#autoEstimate;
		this.#model.configure(estimate, options.gap ?? 0, rowCount(items.length, lanes));
		return { count: items.length, lanes };
	}

	#lanes(): number {
		const c = this.#value.options.lanes ?? 1;
		const n = typeof c === 'function' ? c(this.#axis.crossSize(this.anchor.parentElement)) : c;
		return Math.max(1, Math.floor(n) || 1);
	}

	#isVariable(): boolean {
		return this.#value.options.itemSize === undefined;
	}

	#window(g: Grid): ItemWindow {
		const overscan = this.#value.options.overscan ?? 3;
		const viewport = this.#viewport();
		if (!this.#binding.scroller || viewport <= 0) {
			// Not measurable yet (detached): render a first screenful guess.
			const rows = Math.ceil((this.#value.options.initialCount ?? 20) / g.lanes);
			return computeWindow(this.#model, g.count, g.lanes, 0, this.#model.offset(rows) - 1, 0);
		}
		return computeWindow(this.#model, g.count, g.lanes, this.#scrollPos() - this.#listTop, viewport, overscan);
	}

	/** Header of the section at the top of the viewport (sticky headers need lanes = 1). */
	#activeHeader(): number | undefined {
		if (!this.#binding.scroller || this.#lanesNow > 1) return undefined;
		const { items, options } = this.#value;
		const headers = this.#sticky.headers(items, options.isHeader);
		return this.#sticky.activeHeader(headers, this.#model.rowAt(this.#scrollPos() - this.#listTop));
	}

	// --- small helpers -------------------------------------------------------------------------

	#keyOf(index: number): unknown {
		const { items, options } = this.#value;
		return options.keyFn ? options.keyFn(items[index], index) : index;
	}

	#scrollPos(): number {
		return this.#axis.scrollPos(this.#binding.scroller);
	}

	#viewport(): number {
		return this.#axis.viewport(this.#binding.scroller);
	}

	#ensureAttached(): void {
		const attached = this.#binding.attach(this.#value.options.scroller);
		// The first layout may not be final yet (and a queued scrollToIndex needs a viewport).
		if (attached && (!this.#value.options.scroller || this.#pendingScroll)) {
			queueMicrotask(() => this.#refresh(false));
		}
	}
}
