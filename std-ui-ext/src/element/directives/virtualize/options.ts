import type { VirtualizeController } from './controller.js';

export interface VirtualizeOptions<T = unknown> {
	/** Render one item. Called only for items inside the window. */
	renderItem: (item: T, index: number) => unknown;
	/** Scroll direction: `vertical` (default) or `horizontal`. "Size" below means the extent along it
	 *  (height when vertical, width when horizontal). */
	direction?: 'vertical' | 'horizontal';
	/** Fixed size in px of one row of items (exact mode, no measuring). Items must be this size. */
	itemSize?: number;
	/** Optional hint for variable-size mode (used when `itemSize` is not set): assumed size for
	 *  unmeasured rows. Without it, the mean of measured rows is used (40px before any). */
	estimatedItemSize?: number;
	/** Marks items that are section headers. The header of the section at the top of the viewport
	 *  stays pinned there (`position: sticky` is applied to the header's elements; give them an
	 *  opaque background). Requires `lanes` = 1. The header list is cached per `items` array
	 *  (identity + length): pass a new array when headers change. */
	isHeader?: (item: T, index: number) => boolean;
	/** Stable key per item; defaults to the index. */
	keyFn?: (item: T, index: number) => unknown;
	/** Items per row across the scroll direction (grid lanes when vertical, grid rows when
	 *  horizontal). A function receives the container's cross-axis size (width when vertical,
	 *  height when horizontal) and is re-evaluated on resize. Default 1. */
	lanes?: number | ((containerCrossSize: number) => number);
	/** Gap in px between rows; must match the container's CSS `gap`. Default 0. */
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

/** What `virtualize()` hands to its committer on each render. */
export interface VirtualizeValue {
	items: ArrayLike<unknown>;
	options: VirtualizeOptions<any>;
}
