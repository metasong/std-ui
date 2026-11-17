import type { ScrollAlign } from './layout.js';

export interface ScrollToIndexOptions {
	/** Where the item lands in the viewport. Default `'start'`. */
	align?: ScrollAlign;
	/** `'smooth'` animates; the window follows via scroll events. Default `'auto'` (instant). */
	behavior?: ScrollBehavior;
}

/** Internal surface the renderer implements. */
export interface ControllerTarget {
	scrollToIndex(index: number, options: ScrollToIndexOptions): void;
}

/**
 * Imperative handle for a `virtualize` binding. Create one, pass it as `options.controller`, and
 * call `scrollToIndex()` once the list has rendered. Calls before that are remembered and
 * applied on attach.
 */
export class VirtualizeController {
	#target: ControllerTarget | undefined;
	#pending: [number, ScrollToIndexOptions] | undefined;

	scrollToIndex(index: number, options: ScrollToIndexOptions = {}): void {
		if (this.#target) this.#target.scrollToIndex(index, options);
		else this.#pending = [index, options];
	}

	/** @internal */
	_attach(target: ControllerTarget | undefined): void {
		this.#target = target;
		if (target && this.#pending) {
			const [i, o] = this.#pending;
			this.#pending = undefined;
			target.scrollToIndex(i, o);
		}
	}
}
