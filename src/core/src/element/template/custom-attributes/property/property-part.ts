import { DirectiveSlot, isDirectiveResult, noChange, type PropertyPartInfo } from '../../directives/directive.js';
import { PartType, type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';
import { writeProperty } from './write-property.js';
import { hasSignal, RawValue, SignalBinding } from '../../parts/signal-binding.js';

/**
 * Passes `value` to a `.prop` binding untouched. A bare signal in `.prop=${sig}` is followed like in every
 * other position (the property receives its value and is patched when it changes); wrap it in `raw()` to hand
 * the signal object itself to the element:
 *
 *   t`<x-chart .source=${this.series}>`;       // the element gets the series' current value
 *   t`<x-chart .source=${raw(this.series)}>`;  // the element gets the signal
 *
 * Only meaningful in a `.prop` binding. After unwrapping it is an ordinary value: written like any
 * other (a store field receives it through `.set()`).
 */
export function raw(value: unknown): unknown {
	return new RawValue(value);
}

export class PropertyPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	readonly #slot = new DirectiveSlot();
	readonly #partInfo: PropertyPartInfo;
	readonly #el: Element;
	readonly #name: string;
	constructor(el: Element, name: string, modifiers?: readonly Modifier[]) {
		this.#el = el;
		this.#name = name;
		warnIgnoredModifiers(`.${name}`, modifiers);
		this.#partInfo = { type: PartType.ATTRIBUTE, element: el, name, property: true };
	}

	/** Follows a signal bound here (`.prop=${sig}`) so a change patches only this property. */
	#signal: SignalBinding | undefined; // created on the first signal value

	disconnect(): void {
		this.#signal?.release();
		this.#slot.disconnect();
	}

	dispose(): void {
		this.#signal?.release();
	}

	update(values: readonly unknown[]): void {
		const value = values[0];
		// PERF-CRITICAL, keep inline: runs for every part on every render. Only an object or function can be a
		// signal, so a primitive skips `hasSignal()` with one `typeof`. Measured: calling `hasSignal(values)`
		// directly, or a `maybeSignal(value)` helper, made plain updates 6-38% slower (V8 does not inline them).
		// The same check is in child-part, boolean-part, property-part and attribute-part: if they are ever merged
		// into one shared function, re-measure first (see signal-binding-plan.md in template/).
		if ((typeof value === 'object' || typeof value === 'function') && hasSignal(values)) {
			(this.#signal ??= new SignalBinding('signal binding (property-part)', resolved => this.#apply(resolved[0]))).follow(values);
			return;
		}
		this.#signal?.release();
		this.#apply(value);
	}

	#apply(value: unknown): void {
		// `raw(x)` only stops signal following (see `update()`); once unwrapped, `x` is a plain value.
		if (value instanceof RawValue) value = value.value;
		else if (isDirectiveResult(value)) {
			const result = this.#slot.apply(this.#partInfo, value);
			if (result === noChange) return;
			if (Object.is(result, this.#value)) return;
			this.#value = result;
			writeProperty(this.#el, this.#name, result);
			return;
		}
		this.#slot.disconnect();
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		writeProperty(this.#el, this.#name, value);
	}
}
