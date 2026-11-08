// Axis-dependent DOM reads/writes. Everything else in the committer speaks in "main-axis" terms
// (position, size, offset), so supporting horizontal lists only needs this one switch.

export type Scroller = Element | Window;

export class Axis {
	/** Rect edge on the main axis. */
	readonly side: 'left' | 'top';
	/** CSS size property on the main axis. */
	readonly sizeProp: 'width' | 'height';

	constructor(readonly horizontal: boolean) {
		this.side = horizontal ? 'left' : 'top';
		this.sizeProp = horizontal ? 'width' : 'height';
	}

	/** Scroll position along the main axis. */
	scrollPos(s: Scroller | undefined): number {
		if (this.horizontal) return s instanceof Element ? s.scrollLeft : (s?.scrollX ?? 0);
		return s instanceof Element ? s.scrollTop : (s?.scrollY ?? 0);
	}

	/** Instant scroll to `pos`. */
	setScrollPos(s: Scroller | undefined, pos: number): void {
		if (!s) return;
		if (s instanceof Element) {
			if (this.horizontal) s.scrollLeft = pos;
			else s.scrollTop = pos;
		} else {
			s.scrollTo({ [this.side]: pos, behavior: 'instant' as ScrollBehavior });
		}
	}

	smoothScrollTo(s: Scroller, pos: number): void {
		s.scrollTo({ [this.side]: pos, behavior: 'smooth' });
	}

	/** Visible length of the scroller along the main axis. */
	viewport(s: Scroller | undefined): number {
		if (this.horizontal) return s instanceof Element ? s.clientWidth : (s?.innerWidth ?? 0);
		return s instanceof Element ? s.clientHeight : (s?.innerHeight ?? 0);
	}

	/** Container size across the main axis (what a `lanes` function receives). */
	crossSize(container: Element | null): number {
		return (this.horizontal ? container?.clientHeight : container?.clientWidth) ?? 0;
	}

	/** Position of `el`'s leading edge relative to `scroller`'s, in scroller content coordinates. */
	contentPos(el: Element, scroller: Scroller): number {
		const scrollerEdge = scroller instanceof Element ? scroller.getBoundingClientRect()[this.side] : 0;
		return el.getBoundingClientRect()[this.side] - scrollerEdge + this.scrollPos(scroller);
	}

	/** Extent along the main axis covered by `els`; 0 if none. Adds each element to `seen`. */
	extent(els: Iterable<Element>, seen?: Set<Element>): number {
		let lo = Infinity;
		let hi = -Infinity;
		for (const el of els) {
			seen?.add(el);
			const rect = el.getBoundingClientRect();
			const start = rect[this.side];
			lo = Math.min(lo, start);
			hi = Math.max(hi, start + rect[this.sizeProp]);
		}
		return hi > lo ? hi - lo : 0;
	}
}
