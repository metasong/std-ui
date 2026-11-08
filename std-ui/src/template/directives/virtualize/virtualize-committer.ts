import { Committer } from '../../parts/committers/committer.js';
import { KeyedRows, type KeyedEntries } from '../keyed-rows.js';
import type { ControllerTarget, ScrollToIndexOptions, VirtualizeController } from './controller.js';
import {
	computeWindow,
	rowCount,
	RowModel,
	scrollTarget,
	spacerHeight,
	type Window as ItemWindow,
} from './layout.js';

export interface VirtualizeOptions<T = unknown> {
	/** Render one item. Called only for items inside the window. */
	renderItem: (item: T, index: number) => unknown;
	/** Fixed height in px of one row of items (exact mode, no measuring). Items must be this tall. */
	itemHeight?: number;
	/** Optional hint for variable-height mode (used when `itemHeight` is not set): assumed height
	 *  for unmeasured rows. Without it, the mean of measured rows is used (40px before any). */
	estimatedItemHeight?: number;
	/** Stable key per item; defaults to the index. */
	keyFn?: (item: T, index: number) => unknown;
	/** Items per row. A function receives the container's `clientWidth` (re-evaluated on resize). Default 1. */
	columns?: number | ((containerWidth: number) => number);
	/** Row gap in px; must match the container's CSS `gap`/`row-gap`. Default 0. */
	gap?: number;
	/** Extra rows rendered beyond each edge of the viewport. Default 3. */
	overscan?: number;
	/** Scroll container; defaults to the nearest scrollable ancestor, else the page. */
	scroller?: Element | Window;
	/** Items rendered before a viewport can be measured (e.g. while detached). Default 20. */
	initialCount?: number;
	/** Handle for `scrollToIndex()`. */
	controller?: VirtualizeController;
	/** Tag name of the two spacer elements (use `li` inside `ul`/`ol`). Default `div`. */
	spacerTag?: string;
}

export interface VirtualizeValue {
	items: ArrayLike<unknown>;
	options: VirtualizeOptions<any>;
}

function isScrollable(el: Element): boolean {
	const o = getComputedStyle(el).overflowY;
	return o === 'auto' || o === 'scroll' || o === 'overlay';
}

function findScroller(from: Node): Element | Window {
	let n: Node | null = from;
	while (n) {
		const parent: Node | null =
			n.parentNode ?? (n.nodeType === 11 ? (n as ShadowRoot).host ?? null : null);
		if (parent instanceof Element && isScrollable(parent)) return parent;
		n = parent;
	}
	return window;
}

export class VirtualizeCommitter extends Committer<VirtualizeValue> implements ControllerTarget {
	#rows!: KeyedRows;
	#top!: HTMLElement;
	#bottom!: HTMLElement;
	#value!: VirtualizeValue;
	#controller: VirtualizeController | undefined;

	#scroller: Element | Window | undefined;
	#resizeObserver: ResizeObserver | undefined;
	#raf: number | undefined;
	#disposed = false;
	#listTop = 0;
	#model = new RowModel(1, 0);
	/** Estimate used in variable mode when stimatedItemHeight isn't given: mean of measured rows. */
	#autoEstimate = 40;
	#rowObserver: ResizeObserver | undefined;
	#observed = new Set<Element>();
	#signature = '';
	#pendingScroll: [number, ScrollToIndexOptions] | undefined;
	#onScroll = () => {
		if (this.#raf !== undefined) return;
		this.#raf = requestAnimationFrame(() => {
			this.#raf = undefined;
			this.#refresh(false);
		});
	};

	update(value: VirtualizeValue): boolean {
		if (!this.#rows) {
			const parent = this.anchor.parentNode!;
			const tag = value.options.spacerTag ?? 'div';
			this.#top = this.#makeSpacer(tag);
			this.#bottom = this.#makeSpacer(tag);
			parent.insertBefore(this.#top, this.anchor);
			parent.insertBefore(this.#bottom, this.anchor);
			this.#rows = new KeyedRows(this.#bottom);
		}
		this.#value = value;
		const controller = value.options.controller;
		if (controller !== this.#controller) {
			this.#controller?._attach(undefined);
			this.#controller = controller;
		}
		this.#ensureAttached();
		this.#refresh(true);
		this.#controller?._attach(this);
		if (this.#pendingScroll && this.#scroller) {
			const [i, o] = this.#pendingScroll;
			this.#pendingScroll = undefined;
			this.scrollToIndex(i, o);
		}
		return true;
	}

	scrollToIndex(index: number, options: ScrollToIndexOptions = {}): void {
		this.#ensureAttached();
		if (!this.#scroller) {
			this.#pendingScroll = [index, options];
			return;
		}
		const scroller = this.#scroller;
		const target = (): number => {
			const g = this.#sync();
			const offset = this.#scrollTop() - this.#listTop;
			const rel = scrollTarget(this.#model, g.count, g.columns, index, options.align ?? 'start', offset, this.#viewport());
			return Math.max(0, rel + this.#listTop);
		};
		if (options.behavior === 'smooth') {
			scroller.scrollTo({ top: target(), behavior: 'smooth' }); // window follows via scroll events
			return;
		}
		// Instant. In variable-height mode, rendering the target region measures real heights and
		// moves the target, so iterate until it settles (one pass in fixed mode).
		let top = target();
		for (let pass = 0; pass < 6; pass++) {
			if (scroller instanceof Element) scroller.scrollTop = top;
			else scroller.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
			this.#refresh(false, true);
			const next = target();
			// Settled only if the target stopped moving AND anchoring didn't push scroll off it.
			if (Math.abs(next - top) < 1 && Math.abs(this.#scrollTop() - next) < 1) break;
			top = next;
		}
	}

	override disconnect(): void {
		this.#detach();
		this.#rows?.disconnect();
	}

	dispose(): void {
		this.#disposed = true;
		this.#detach();
		this.#controller?._attach(undefined);
		this.#controller = undefined;
		this.#rows?.dispose();
		this.#top?.remove();
		this.#bottom?.remove();
	}

	// --- scroller wiring -----------------------------------------------------------------------

	#ensureAttached(): void {
		if (this.#scroller || !this.anchor.isConnected) return;
		const scroller = this.#value.options.scroller ?? findScroller(this.anchor);
		this.#scroller = scroller;
		scroller.addEventListener('scroll', this.#onScroll, { passive: true });
		if (typeof ResizeObserver !== 'undefined') {
			this.#resizeObserver = new ResizeObserver(() => this.#refresh(false));
			this.#rowObserver = new ResizeObserver(() => this.#refresh(false, true));
			this.#resizeObserver.observe(scroller instanceof Element ? scroller : document.documentElement);
			const parent = this.anchor.parentElement;
			if (parent && parent !== scroller) this.#resizeObserver.observe(parent);
		}
		if (!this.#value.options.scroller || this.#pendingScroll) queueMicrotask(() => this.#refresh(false));
	}

	#detach(): void {
		this.#scroller?.removeEventListener('scroll', this.#onScroll);
		this.#scroller = undefined;
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = undefined;
		this.#rowObserver?.disconnect();
		this.#rowObserver = undefined;
		this.#observed.clear();
		if (this.#raf !== undefined) cancelAnimationFrame(this.#raf);
		this.#raf = undefined;
	}

	// --- measuring -----------------------------------------------------------------------------

	#scrollTop(): number {
		const s = this.#scroller;
		return s instanceof Element ? s.scrollTop : (s?.scrollY ?? 0);
	}

	#viewport(): number {
		const s = this.#scroller;
		return s instanceof Element ? s.clientHeight : (s?.innerHeight ?? 0);
	}

	#columns(): number {
		const c = this.#value.options.columns ?? 1;
		const n = typeof c === 'function' ? c(this.anchor.parentElement?.clientWidth ?? 0) : c;
		return Math.max(1, Math.floor(n) || 1);
	}

	#dynamic(): boolean {
		return this.#value.options.itemHeight === undefined;
	}

	/** Push current options/data into the row model; returns the grid shape. */
	#sync(): { count: number; columns: number } {
		const { options, items } = this.#value;
		const columns = this.#columns();
		const estimate = options.itemHeight ?? options.estimatedItemHeight ?? this.#autoEstimate;
		this.#model.configure(estimate, options.gap ?? 0, rowCount(items.length, columns));
		return { count: items.length, columns };
	}

	/** Measure rendered rows (variable-height mode). Returns true if any row height changed. */
	#measureRows(win: ItemWindow, columns: number): boolean {
		const { items, options } = this.#value;
		const keyFn = options.keyFn;
		let changed = false;
		const seenEls = new Set<Element>();
		for (let r = win.startRow; r < win.endRow; r++) {
			let top = Infinity;
			let bottom = -Infinity;
			let rowHeight = 0;
			for (let i = r * columns; i < Math.min(items.length, (r + 1) * columns); i++) {
				const els = this.#rows.elements(keyFn ? keyFn(items[i], i) : i);
				let itemTop = Infinity;
				let itemBottom = -Infinity;
				for (const el of els) {
					seenEls.add(el);
					const rect = el.getBoundingClientRect();
					itemTop = Math.min(itemTop, rect.top);
					itemBottom = Math.max(itemBottom, rect.top + rect.height);
				}
				if (itemBottom > itemTop) rowHeight = Math.max(rowHeight, itemBottom - itemTop);
				top = Math.min(top, itemTop);
				bottom = Math.max(bottom, itemBottom);
			}
			if (rowHeight > 0 && this.#model.setHeight(r, rowHeight)) changed = true;
		}
		if (this.#rowObserver) {
			for (const el of this.#observed) {
				if (!seenEls.has(el)) {
					this.#rowObserver.unobserve(el);
					this.#observed.delete(el);
				}
			}
			for (const el of seenEls) {
				if (!this.#observed.has(el)) {
					this.#rowObserver.observe(el);
					this.#observed.add(el);
				}
			}
		}
		// No explicit estimate: unmeasured rows assume the mean of the measured ones.
		if (options.estimatedItemHeight === undefined) {
			const avg = this.#model.measuredAverage();
			if (avg !== undefined && Math.abs(avg - this.#autoEstimate) >= 0.5) {
				this.#autoEstimate = avg;
				this.#model.configure(avg, this.#model.gap, this.#model.rows);
				changed = true;
			}
		}
		return changed;
	}

	/** Re-derive the list's top edge (in scroller content coordinates) from the first rendered row. */
	#measureListTop(win: ItemWindow): void {
		const scroller = this.#scroller;
		if (!scroller || win.end === win.start) return;
		let first: Element | null = this.#top.nextElementSibling;
		if (first === this.#bottom) first = null;
		if (!first) return;
		const scrollerTop = scroller instanceof Element ? scroller.getBoundingClientRect().top : 0;
		const rel = first.getBoundingClientRect().top - scrollerTop + this.#scrollTop();
		this.#listTop = rel - this.#model.offset(win.startRow);
	}

	// --- rendering -----------------------------------------------------------------------------

	#window(g: { count: number; columns: number }): ItemWindow {
		const overscan = this.#value.options.overscan ?? 3;
		const viewport = this.#viewport();
		if (!this.#scroller || viewport <= 0) {
			const rows = Math.ceil((this.#value.options.initialCount ?? 20) / g.columns);
			return computeWindow(this.#model, g.count, g.columns, 0, this.#model.offset(rows) - 1, 0);
		}
		return computeWindow(this.#model, g.count, g.columns, this.#scrollTop() - this.#listTop, viewport, overscan);
	}

	/**
	 * `full`: parent re-rendered, so re-run `renderItem` for every windowed item.
	 * `force`: reconcile/measure even if the window is unchanged (row sizes may have changed).
	 */
	#refresh(full: boolean, force = false): void {
		if (this.#disposed || !this.#rows || !this.#value) return;
		for (let pass = 0; pass < 4; pass++) {
			const g = this.#sync();
			// Anchor on the first visible row so measuring rows above it doesn't make content jump.
			const anchorRow = this.#scroller ? this.#model.rowAt(this.#scrollTop() - this.#listTop) : 0;
			const anchorOffset = this.#model.offset(anchorRow);
			const win = this.#window(g);
			const sig = `${win.start}:${win.end}:${g.columns}:${g.count}:${this.#model.estimate}:${this.#model.gap}`;
			if (!full && !force && sig === this.#signature) return;
			this.#signature = sig;
			this.#render(g, win, full);
			const measured = this.#dynamic() && this.#measureRows(win, g.columns);
			if (measured) this.#applySpacers(win);
			const before = this.#listTop;
			this.#measureListTop(win);
			let moved = Math.abs(this.#listTop - before) >= 0.5;
			if (measured && this.#scroller) {
				const delta = this.#model.offset(anchorRow) - anchorOffset;
				if (Math.abs(delta) >= 0.5) {
					this.#scrollBy(delta);
					moved = true;
				}
			}
			if (!moved && !measured) return;
			full = false; // settle again against the corrected layout
			force = true;
		}
	}

	#scrollBy(delta: number): void {
		const s = this.#scroller;
		if (s instanceof Element) s.scrollTop += delta;
		else s?.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
	}

	#render(g: { count: number; columns: number }, win: ItemWindow, full: boolean): void {
		const { items, options } = this.#value;
		const keyFn = options.keyFn;
		const seen = new Set<unknown>();
		const entries: { key: unknown; value: unknown }[] = [];
		const rows = this.#rows;
		for (let i = win.start; i < win.end; i++) {
			const item = items[i];
			const key = keyFn ? keyFn(item, i) : i;
			if (seen.has(key)) throw new Error(`std-ui virtualize(): duplicate key ${String(key)}.`);
			seen.add(key);
			entries.push({ key, value: full || !rows.has(key) ? options.renderItem(item, i) : undefined });
		}
		rows.update(entries as KeyedEntries, () => full);
		this.#applySpacers(win);
	}

	#applySpacers(win: ItemWindow): void {
		this.#setSpacer(this.#top, spacerHeight(this.#model, 0, win.startRow));
		this.#setSpacer(this.#bottom, spacerHeight(this.#model, win.endRow, this.#model.rows));
	}
	#makeSpacer(tag: string): HTMLElement {
		const el = document.createElement(tag);
		el.setAttribute('aria-hidden', 'true');
		el.dataset.stdUiSpacer = '';
		el.style.cssText = 'display:none;grid-column:1/-1;flex:none;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none';
		return el;
	}

	#setSpacer(el: HTMLElement, height: number): void {
		if (height <= 0) {
			el.style.display = 'none';
		} else {
			el.style.display = 'block';
			el.style.height = `${height}px`;
		}
	}
}
