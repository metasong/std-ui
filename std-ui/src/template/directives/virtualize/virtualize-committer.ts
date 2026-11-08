import { Committer } from '../../parts/committers/committer.js';
import { KeyedRows, type KeyedEntries } from '../keyed-rows.js';
import type { ControllerTarget, ScrollToIndexOptions, VirtualizeController } from './controller.js';
import {
	computeWindow,
	rowCount,
	rowOffset,
	scrollTarget,
	spacerHeight,
	type GridMetrics,
	type Window as ItemWindow,
} from './layout.js';

export interface VirtualizeOptions<T = unknown> {
	/** Render one item. Called only for items inside the window. */
	renderItem: (item: T, index: number) => unknown;
	/** Height in px of one row of items. Items must actually be this tall. */
	itemHeight: number;
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
		const m = this.#metrics();
		const offset = this.#scrollTop() - this.#listTop;
		const rel = scrollTarget(m, index, options.align ?? 'start', offset, this.#viewport());
		const top = Math.max(0, rel + this.#listTop);
		const scroller = this.#scroller;
		if (options.behavior === 'smooth') {
			scroller.scrollTo({ top, behavior: 'smooth' }); // window follows via scroll events
			return;
		}
		if (scroller instanceof Element) scroller.scrollTop = top;
		else scroller.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
		this.#refresh(false);
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

	#metrics(): GridMetrics {
		const { options, items } = this.#value;
		return {
			count: items.length,
			columns: this.#columns(),
			itemHeight: options.itemHeight,
			gap: options.gap ?? 0,
		};
	}

	/** Re-derive the list's top edge (in scroller content coordinates) from the first rendered row. */
	#measureListTop(win: ItemWindow, m: GridMetrics): void {
		const scroller = this.#scroller;
		if (!scroller || win.end === win.start) return;
		let first: Element | null = this.#top.nextElementSibling;
		if (first === this.#bottom) first = null;
		if (!first) return;
		const scrollerTop = scroller instanceof Element ? scroller.getBoundingClientRect().top : 0;
		const rel = first.getBoundingClientRect().top - scrollerTop + this.#scrollTop();
		this.#listTop = rel - rowOffset(m, win.startRow);
	}

	// --- rendering -----------------------------------------------------------------------------

	#window(m: GridMetrics): ItemWindow {
		const overscan = this.#value.options.overscan ?? 3;
		const viewport = this.#viewport();
		if (!this.#scroller || viewport <= 0) {
			const rows = Math.ceil((this.#value.options.initialCount ?? 20) / m.columns);
			return computeWindow(m, 0, rows * (m.itemHeight + m.gap), 0);
		}
		return computeWindow(m, this.#scrollTop() - this.#listTop, viewport, overscan);
	}

	/** `full`: parent re-rendered, so re-run `renderItem` for every windowed item. */
	#refresh(full: boolean): void {
		if (this.#disposed || !this.#rows || !this.#value) return;
		for (let pass = 0; pass < 2; pass++) {
			const m = this.#metrics();
			const win = this.#window(m);
			const sig = `${win.start}:${win.end}:${m.columns}:${m.count}:${m.itemHeight}:${m.gap}`;
			if (!full && sig === this.#signature) return;
			this.#signature = sig;
			this.#render(m, win, full);
			const before = this.#listTop;
			this.#measureListTop(win, m);
			if (Math.abs(this.#listTop - before) < 0.5) return;
			full = false; // top edge moved (e.g. first measurement): settle once more
		}
	}

	#render(m: GridMetrics, win: ItemWindow, full: boolean): void {
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
		this.#setSpacer(this.#top, spacerHeight(m, win.startRow));
		this.#setSpacer(this.#bottom, spacerHeight(m, rowCount(m) - win.endRow));
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
