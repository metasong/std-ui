import { Directive, directive, noChange, type ElementPartInfo, type PartInfo } from '../directive.js';
import { PartType } from '../../parts/part.js';
import { state, type State } from '../../../../reactive/signal/index.js';
import { assertPosition } from '../assert-child-part.js';

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
 * Bound on the element itself, no attribute name:
 *
 *   const input = createRef<HTMLInputElement>();
 *   t`<input ${ref(input)}>`;          // input() is the element after render
 *   t`<input ${ref(el => el?.focus())}>`; // callback form
 *
 * The ref is cleared (or the callback called with `undefined`) when the binding is torn down
 * or later given a different `Ref` (or switched between a `Ref` and a callback). A callback replaced by
 * another callback is not a switch, so an inline `ref(el => ...)` runs once, not on every render.
 */
class RefDirective extends Directive {
	#ref: RefOrCallback | undefined;
	/** Element `#ref` was last told about; re-renders with the same ref and element are no-ops. */
	#element: Element | undefined;
	/** Host passed to `render()`; callback refs are called with it as `this`. */
	#host: unknown;

	constructor(partInfo: PartInfo) {
		super(partInfo);
		assertPosition(partInfo.type === PartType.ELEMENT, 'ref', 'an element, e.g. <input ${ref(r)}>');
	}

	override update(part: ElementPartInfo, ref: RefOrCallback): typeof noChange {
		this.#host = part.host;
		if (ref !== this.#ref) {
			// Two callbacks are the same binding: an inline `ref(el => ...)` is a new function on every render,
			// so a changed identity says nothing. Keep the latest one (teardown calls it) without notifying.
			// Refs (stable signals) and callback <-> ref changes are real switches: clear the old one first.
			if (this.#ref && isCallback(this.#ref) && isCallback(ref)) {
				this.#ref = ref;
			} else {
				this.#set(undefined);
				this.#ref = ref;
				this.#element = undefined;
			}
		}
		if (this.#element !== part.element) {
			this.#element = part.element;
			this.#set(part.element);
		}
		return noChange;
	}

	override disconnected(): void {
		this.#set(undefined);
		this.#ref = undefined;
		this.#element = undefined;
	}

	#set(el: Element | undefined): void {
		const ref = this.#ref;
		if (!ref) return;
		if (isRef(ref)) {
			// Only clear a ref that still points at our element, so a ref handed to another binding isn't wiped.
			if (el || ref.peek() === this.#element) ref.set(el);
		} else ref.call(this.#host, el);
	}
}

/** A `Ref` is a signal, which is also a function: tell it from a callback by its `set`.
 *  (Guards `Ref`, not `RefCallback`: a `Ref` is itself assignable to `RefCallback`, so the false branch of a
 *  `ref is RefCallback` guard would narrow to `never`.) */
function isRef(ref: RefOrCallback): ref is Ref {
	return 'set' in ref;
}
function isCallback(ref: RefOrCallback): boolean {
	return !isRef(ref);
}

export const ref = directive(RefDirective);
