// --- SignalBinding: lets a part own the reactive update of a bound signal. ------------------------
//
// When a value bound in a child or attribute position is a signal itself (`${this.count}`, not
// `${this.count.get()}`), `template()` never reads it, so the host's template effect is not
// subscribed to it. The part subscribes instead, with its own effect, and patches only its slot.
// See `../signal-binding-plan.md`.
import { effect } from '../../../reactive/effect/effect.js';
import { isWatchableSignal, watchSignal } from '../../../reactive/effect/watch-signal.js';
import { isReadableState } from '../../../reactive/signal/state.js';
import { untrack } from '../../../reactive/signal/tracking.js';
import { warnOnce } from './part.js';

/** Replaces every signal in `values` with its current value (tracked when called inside an effect). */
function resolve(values: readonly unknown[], track: boolean): unknown[] {
	const out = new Array<unknown>(values.length);
	for (let i = 0; i < values.length; i++) {
		const v = values[i];
		out[i] = isReadableState(v) ? (track ? v.get() : v.peek()) : v;
	}
	return out;
}

/** Owns at most one effect that mirrors the signals among a part's values into the part. */
export class SignalBinding {
	#dispose: (() => void) | undefined;
	#values: readonly unknown[] | undefined;
	readonly #name: string;
	readonly #apply: (resolved: unknown[]) => void;

	/**
	 * `name` labels the owning part in cycle errors; pass a string literal (shared, not built per
	 * binding), e.g. `'signal binding (child-part)'`. `apply` is called with the resolved values now and
	 * on every signal change.
	 */
	constructor(name: string, apply: (resolved: unknown[]) => void) {
		this.#name = name;
		this.#apply = apply;
	}

	/**
	 * Call from `Part.update()` when `hasSignal(values)`: binds the signals, and `apply` runs now and on
	 * every signal change. When `values` holds only plain values, call `release()` and update as usual.
	 * A part creates its `SignalBinding` on first need (`this.#signal ??= new SignalBinding(...)`), so
	 * parts that never see a signal pay nothing.
	 */
	follow(values: readonly unknown[]): void {
		const prev = this.#values;
		this.#values = values;
		if (this.#dispose && prev && sameShape(prev, values)) {
			// Same signals: the effect already follows them. Only a changed plain value needs a re-apply.
			if (!samePlain(prev, values)) this.#apply(resolve(values, false));
			return;
		}
		this.#dispose?.();
		// The common case, one signal and nothing else in the slot: watch it directly, with no effect (and no
		// computed on top of the signal) in between. `watchSignal` already runs untracked.
		const only = values.length === 1 ? values[0] : undefined;
		if (isWatchableSignal(only)) {
			this.#dispose = watchSignal(only, value => this.#apply([value]), this.#name);
			return;
		}
		// Untracked: the first run is synchronous, and the part may be created inside the host's template
		// effect, which must not pick these signals up as its own dependencies.
		this.#dispose = untrack(() => effect(() => {
			// Only the signals bound here are dependencies; whatever `apply` reads (directives, nested
			// templates) must not become one.
			const resolved = resolve(this.#values!, true);
			untrack(() => this.#apply(resolved));
		}, null, { name: this.#name })); // a name, not a dev creation stack: that would only point here
	}

	/** Stops following the signals. The next `follow()` binds again. */
	release(): void {
		this.#dispose?.();
		this.#dispose = undefined;
		this.#values = undefined;
	}
}

/** Whether any of `values` is a signal (so the part should `follow()` it). */
export function hasSignal(values: readonly unknown[]): boolean {
	// Runs for every part on every render, so the common case (a primitive) must cost one `typeof` and
	// no call: only objects and functions can be signals.
	for (let i = 0; i < values.length; i++) {
		const v = values[i];
		if ((typeof v === 'object' || typeof v === 'function') && isReadableState(v)) return true;
	}
	return false;
}

/** Same signals at the same positions (plain values may differ). */
function sameShape(a: readonly unknown[], b: readonly unknown[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		// A position holding a signal on either side must hold the same signal. Plain next to plain may differ:
		// html`<div class="${this.kind} ${'static-or-changing'}">` - the second one.
		if ((isReadableState(a[i]) || isReadableState(b[i])) && a[i] !== b[i]) return false;
	}
	return true;
}

/** Every value is `Object.is`-equal to its previous one (so a re-apply would change nothing). */
function samePlain(a: readonly unknown[], b: readonly unknown[]): boolean {
	for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
	return true;
}

/** Marker made by `raw()`: `PropertyPart` assigns `value` as is, without following it if it is a signal. */
export class RawValue {
	constructor(readonly value: unknown) {}
}

/**
 * DEV only (call as `if (DEV) warnMisplacedValue(...)` so it tree-shakes): warns about a plain value that makes no sense where it is bound (a `RawValue` outside a `.prop`
 * binding, or a function in a child position). Call it from the part's plain path only: neither is a signal,
 * so neither ever reaches a `SignalBinding`. A function in an attribute slot is stringified like any other
 * value, and an event slot never reaches this code, so only the child position flags functions.
 */
export function warnMisplacedValue(value: unknown, position: 'child' | 'attribute' | 'boolean attribute'): void {
	if (value instanceof RawValue) {
		warnOnce(`std-ui html: raw() only applies to a .prop binding; in a ${position} position it would be rendered as "[object Object]". Remove raw() here.`);
	} else if (position === 'child' && typeof value === 'function') {
		warnOnce('std-ui html: a function in a child position is not called; it would be rendered as its source text. Call it (${fn()}) or pass a computed() so the slot follows it.');
	}
}
