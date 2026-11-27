import { type Modifier, type Part, warnIgnoredModifiers } from '../../parts/part.js';
import { hasSignal, SignalBinding, warnMisplacedValue } from '../../parts/signal-binding.js';
import { DEV } from '../../../../dev/flag.js';

export class BooleanAttributePart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	readonly #el: Element;
	readonly #name: string;
	constructor(el: Element, name: string, modifiers?: readonly Modifier[]) {
		this.#el = el;
		this.#name = name;
		warnIgnoredModifiers(`?${name}`, modifiers);
	}

	/** Follows a signal bound here (`?open=${this.open}`) so a change patches only this attribute. */
	#signal: SignalBinding | undefined; // created on the first signal value

	disconnect(): void {
		this.#signal?.release();
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
			(this.#signal ??= new SignalBinding('signal binding (boolean-attribute-part)', resolved => this.#apply(resolved[0]))).follow(values);
			return;
		}
		this.#signal?.release();
		this.#apply(value);
	}

	#apply(value: unknown): void {
		if (DEV) warnMisplacedValue(value, 'boolean attribute');
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.#el.toggleAttribute(this.#name, Boolean(value));
	}
}
