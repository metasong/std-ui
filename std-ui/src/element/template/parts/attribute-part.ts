import { applyDirective, isDirectiveResult, noChange, type AttributePartInfo, type Directive } from '../directive.js';
import { PartType, type Modifier, type Part, warnIgnoredModifiers } from './part.js';

/**
 * Binds an attribute's full value, which may be composed of static text segments (`literals`)
 * interleaved with any number of interpolations - mirroring how the tagged template itself is
 * structured: `literals.length === valueCount + 1`. Defaults to `['', '']` (a bare `attr=${v}`
 * with no static text), the only shape that supports attribute *removal* via `null`/`undefined`,
 * since a value sitting next to static text can't be meaningfully "absent".
 */
export class AttributePart implements Part {
	readonly valueCount: number;
	/** Last string written via `setAttribute`, or `null` once removed; `undefined` before any update. */
	#committed: string | null | undefined;
	/** The `Directive` instance bound here, if a `directive()`-made value was ever applied to this
	 *  position; reused across renders (so it can keep its own state) as long as the same directive
	 *  function keeps being used - see `directive.ts`. Keyed by that value's index among this
	 *  attribute's interpolations, since an attribute mixing static text with a directive (see
	 *  `#applyWithStaticText` below) may in principle hold more than one. */
	#directives: Array<Directive | undefined> = [];
	/** This position's `AttributePartInfo`, built once and handed to directives - see `directive.ts`. */
	#partInfo: AttributePartInfo;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		private readonly literals: readonly string[] = ['', ''],
		modifiers?: readonly Modifier[],
	) {
		warnIgnoredModifiers(name, modifiers);
		this.valueCount = literals.length - 1;
		this.#partInfo = { type: PartType.ATTRIBUTE, element: el, name };
	}

	/** Runs `disconnected()` on every bound directive and forgets them. */
	disconnect(): void {
		for (const d of this.#directives) d?.disconnected();
		this.#directives = [];
	}

	update(values: readonly unknown[]): void {
		if (!values.some(isDirectiveResult)) this.disconnect();
		const isBareSingleValue = this.literals.length === 2 && this.literals[0] === '' && this.literals[1] === '';

		if (isBareSingleValue && isDirectiveResult(values[0])) {
			const { instance, value } = applyDirective(this.#partInfo, values[0], this.#directives[0]);
			this.#directives[0] = instance;
			if (value === noChange) {
				// The directive applied its own update imperatively (e.g. via classList/el.style), not
				// via setAttribute - forget any stale #committed string so a later plain value can't be
				// mistaken for "unchanged" against DOM state that was actually mutated some other way.
				this.#committed = undefined;
				return;
			}
			this.#commitValue(value);
			return;
		}

		if (isBareSingleValue && values[0] == null) {
			this.#commitValue(null);
			return;
		}

		// An attribute mixing static text (and/or other plain interpolations) alongside one or more
		// directive-made values, e.g. `style="${styleMap(styles)}border:1px solid red;"` - see
		// `#applyWithStaticText()`. This part has no built-in knowledge of what kind of directive is
		// involved (`classMap`, `styleMap`, or anything else) - that's entirely up to whichever
		// `Directive` subclass reads `part.staticText` (`./directive.js`).
		if (values.some(isDirectiveResult)) {
			this.#applyWithStaticText(values);
			return;
		}

		let composed = this.literals[0];
		for (let i = 0; i < values.length; i++) composed += (values[i] == null ? '' : String(values[i])) + this.literals[i + 1];

		if (composed === this.#committed) return;
		this.#committed = composed;
		this.el.setAttribute(this.name, composed);
	}

	/**
	 * Handles an attribute that mixes static text (and/or other plain-value interpolations) with
	 * one or more directive-made values. A plain `setAttribute(name, composed)` - this part's usual
	 * fallback for mixed values - can't represent a directive that applies itself imperatively
	 * (`classMap`/`styleMap` via `classList`/`element.style`, say): stringifying its `DirectiveResult`
	 * object into the composed text would silently produce garbage instead of ever invoking it (the
	 * bug this method exists to fix). Instead: compute `staticText` - the surrounding literal/plain
	 * content with every directive's own slot replaced by `''` - then hand each directive value its
	 * own `part.staticText` (`./directive.js`) so *it* can decide how to combine the two (this part
	 * has no idea how; see that field's own doc comment). Throws if a directive ignores
	 * `staticText` and resolves to something other than `noChange` - this part can't fold an
	 * imperative directive's effect back into one composed attribute string.
	 */
	#applyWithStaticText(values: readonly unknown[]): void {
		let staticText = this.literals[0];
		for (let i = 0; i < values.length; i++) {
			const value = values[i];
			if (!isDirectiveResult(value)) staticText += value == null ? '' : String(value);
			staticText += this.literals[i + 1];
		}
		const partInfo: AttributePartInfo = { ...this.#partInfo, staticText };

		for (let i = 0; i < values.length; i++) {
			const value = values[i];
			if (!isDirectiveResult(value)) continue;

			const { instance, value: result } = applyDirective(partInfo, value, this.#directives[i]);
			this.#directives[i] = instance;
			if (result !== noChange) {
				throw new Error(
					`std-ui html: a directive bound inside a "${this.name}" attribute alongside static text must ` +
						`apply itself imperatively (return noChange from update(), reading part.staticText) - a ` +
						`directive that resolves to its own string/value can't be combined with static text in ` +
						`the same "${this.name}" attribute.`,
				);
			}
		}
		// Same reasoning as the bare-directive branch above: this part's own DOM mutations weren't
		// routed through `setAttribute`, so any stale composed-string tracking is no longer valid.
		this.#committed = undefined;
	}

	/** Shared commit path for a bare single value, whether it came straight from `values[0]` or
	 *  from a directive's `render()`/`update()`: `null`/`undefined` removes the attribute, anything
	 *  else is stringified and set, no-op'ing when unchanged from last time. */
	#commitValue(value: unknown): void {
		if (value == null) {
			if (this.#committed === null) return;
			this.#committed = null;
			this.el.removeAttribute(this.name);
			return;
		}
		const str = String(value);
		if (str === this.#committed) return;
		this.#committed = str;
		this.el.setAttribute(this.name, str);
	}
}

/** `class:active=${on}` / `style:color=${c}`: binds one entry of the `class` or `style` attribute,
 *  leaving every other entry alone. A class is toggled by truthiness; a style property is set via
 *  `setProperty` (kebab-case, `--custom` works) and `null`/`undefined`/`false` removes it. */
export class AttributeEntryPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	constructor(
		private readonly el: Element,
		private readonly attribute: 'class' | 'style',
		private readonly entry: string,
		modifiers?: readonly Modifier[],
	) {
		warnIgnoredModifiers(`${attribute}:${entry}`, modifiers);
	}
	update(values: readonly unknown[]): void {
		const value = this.attribute === 'class' ? Boolean(values[0]) : values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		if (this.attribute === 'class') {
			this.el.classList.toggle(this.entry, value as boolean);
			return;
		}
		const style = (this.el as HTMLElement).style;
		if (value == null || value === false) style.removeProperty(this.entry);
		else style.setProperty(this.entry, String(value));
	}
}
