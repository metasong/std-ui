import type { Scroller } from './axis.js';

function isScrollable(el: Element): boolean {
	const s = getComputedStyle(el);
	// Either axis: horizontal lists often set `overflow-y: hidden`.
	return [s.overflowY, s.overflowX].some((o) => o === 'auto' || o === 'scroll' || o === 'overlay');
}

/** Nearest scrollable ancestor (crossing shadow roots), else the page. */
export function findScroller(from: Node): Scroller {
	let n: Node | null = from;
	while (n) {
		const parent: Node | null = n.parentNode ?? (n.nodeType === 11 ? ((n as ShadowRoot).host ?? null) : null);
		if (parent instanceof Element && isScrollable(parent)) return parent;
		n = parent;
	}
	return window;
}

export interface BindingHooks {
	/** Scrolled (already throttled to one call per frame). */
	scroll(): void;
	/** Scroller or container resized. */
	resize(): void;
	/** A rendered row element resized. */
	rowResize(): void;
}

/**
 * Owns the live connections to the outside world: the scroll listener, the `ResizeObserver`s on
 * the scroller/container, and the one on rendered row elements.
 */
export class ScrollerBinding {
	#scroller: Scroller | undefined;
	#resizeObserver: ResizeObserver | undefined;
	#rowObserver: ResizeObserver | undefined;
	#observedRows = new Set<Element>();
	#raf: number | undefined;

	constructor(
		private readonly anchor: Node,
		private readonly hooks: BindingHooks,
	) {}

	get scroller(): Scroller | undefined {
		return this.#scroller;
	}

	readonly #onScroll = () => {
		if (this.#raf !== undefined) return;
		this.#raf = requestAnimationFrame(() => {
			this.#raf = undefined;
			this.hooks.scroll();
		});
	};

	/** Attach to `explicit` or the nearest scroller. Returns true if newly attached (false if already
	 *  attached or the anchor isn't in the document yet). */
	attach(explicit?: Scroller): boolean {
		if (this.#scroller || !this.anchor.isConnected) return false;
		const scroller = explicit ?? findScroller(this.anchor);
		this.#scroller = scroller;
		scroller.addEventListener('scroll', this.#onScroll, { passive: true });
		if (typeof ResizeObserver !== 'undefined') {
			this.#resizeObserver = new ResizeObserver(() => this.hooks.resize());
			this.#rowObserver = new ResizeObserver(() => this.hooks.rowResize());
			this.#resizeObserver.observe(scroller instanceof Element ? scroller : document.documentElement);
			const parent = this.anchor.parentElement;
			if (parent && parent !== scroller) this.#resizeObserver.observe(parent);
		}
		return true;
	}

	detach(): void {
		this.#scroller?.removeEventListener('scroll', this.#onScroll);
		this.#scroller = undefined;
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = undefined;
		this.#rowObserver?.disconnect();
		this.#rowObserver = undefined;
		this.#observedRows.clear();
		if (this.#raf !== undefined) cancelAnimationFrame(this.#raf);
		this.#raf = undefined;
	}

	/** Observe exactly `rows` for size changes (unobserving elements that left). */
	syncRows(rows: ReadonlySet<Element>): void {
		const observer = this.#rowObserver;
		if (!observer) return;
		for (const el of this.#observedRows) {
			if (!rows.has(el)) {
				observer.unobserve(el);
				this.#observedRows.delete(el);
			}
		}
		for (const el of rows) {
			if (!this.#observedRows.has(el)) {
				observer.observe(el);
				this.#observedRows.add(el);
			}
		}
	}
}
