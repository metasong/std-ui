import type { Axis } from './axis.js';

/**
 * The two hidden elements that stand in for rows outside the window. Both are inserted before
 * `anchor`: `[top][rows…][bottom]`.
 */
export class Spacers {
	readonly top: HTMLElement;
	readonly bottom: HTMLElement;

	constructor(
		anchor: Node,
		tag: string,
		private readonly axis: Axis,
	) {
		this.top = this.#make(tag);
		this.bottom = this.#make(tag);
		const parent = anchor.parentNode!;
		parent.insertBefore(this.top, anchor);
		parent.insertBefore(this.bottom, anchor);
	}

	setTop(size: number): void {
		this.#set(this.top, size);
	}

	setBottom(size: number): void {
		this.#set(this.bottom, size);
	}

	remove(): void {
		this.top.remove();
		this.bottom.remove();
	}

	#make(tag: string): HTMLElement {
		const el = document.createElement(tag);
		el.setAttribute('aria-hidden', 'true');
		el.dataset.stdUiSpacer = '';
		// Span every grid track so the spacer never occupies a single cell.
		const span = this.axis.horizontal ? 'grid-row:1/-1;align-self:stretch' : 'grid-column:1/-1';
		el.style.cssText = `display:none;${span};flex:none;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none`;
		return el;
	}

	#set(el: HTMLElement, size: number): void {
		if (size <= 0) {
			el.style.display = 'none';
		} else {
			el.style.display = 'block';
			el.style[this.axis.sizeProp] = `${size}px`;
		}
	}
}
