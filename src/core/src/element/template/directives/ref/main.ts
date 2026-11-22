import { Directive, directive, noChange, type ElementPartInfo, type PartInfo } from '../directive.js';
import { PartType } from '../../parts/part.js';
import { state, type State } from '../../../../reactive/signal/index.js';

/** A signal holding the rendered element, filled in by `ref()`: `undefined` before the first render and after
 *  teardown. Read it by calling it (tracked in effects/templates), or `.peek()` for an untracked read. */
export type Ref<T extends Element = Element> = State<T | undefined>;
/** Called with the element when it renders, and with `undefined` when the binding is torn down
 *  or switched to another ref. */
export type RefCallback<T extends Element = Element> = (el: T | undefined) => void;

export type RefOrCallback<T extends Element = Element> = Ref<T> | RefCallback<T>;

/** Creates an empty `Ref` to pass to `ref()`, e.g. `const input = createRef<HTMLInputElement>()`. */
export function createRef<T extends Element = Element>(): Ref<T> {
	return state<T | undefined>(undefined);
}

/**
 * `ref` directive: gives access to the element it is bound to
 *. Bound on the element itself, no attribute name:
 *
 *   const input = createRef<HTMLInputElement>();
 *   t`<input ${ref(input)}>`;          // input() is the element after render
 *   t`<input ${ref(el => el?.focus())}>`; // callback form
 *
 * The ref is cleared (or the callback called with `undefined`) when the binding is torn down
 * or later given a different ref.
 */
class RefDirective extends Directive {
	#ref: RefOrCallback | undefined;
	/** Element `#ref` was last told about; re-renders with the same ref and element are no-ops. */
	#element: Element | undefined;
	/** Host passed to `render()`; callback refs are called with it as `this`. */
	#host: unknown;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error('std-ui ref(): must be bound to an element, e.g. <input ${ref(r)}>.');
		}
	}

	override update(part: ElementPartInfo, ref: RefOrCallback): typeof noChange {
		this.#host = part.host;
		if (ref !== this.#ref) {
			this.#set(undefined);
			this.#ref = ref;
			this.#element = undefined;
		}
		if (this.#element !== part.element) {
			this.#element = part.element;
			this.#set(part.element);
		}
		return noChange;
	}

	override disconnected(): void {
		// Only clear a ref that still points at our element, so a ref handed to another binding isn't wiped.
		this.#set(undefined);
		this.#ref = undefined;
		this.#element = undefined;
	}

	#set(el: Element | undefined): void {
		const ref = this.#ref;
		if (!ref) return;
		// A `Ref` is a signal, which is also a function: tell it from a callback by its `set`.
		if ('set' in ref) {
			if (el || ref.peek() === this.#element) ref.set(el);
		} else ref.call(this.#host, el);
	}
}

export const ref = directive(RefDirective);
