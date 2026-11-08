// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `compile.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

import { isTemplateResult, type TemplateResult } from '../html.js';
import { isUnsafeHtml } from '../directives/unsafe-html.js';
import {
	applyDirective,
	isDirectiveResult,
	noChange,
	PartType,
	type AttributePartInfo,
	type ChildPartInfo,
	type Directive,
} from '../directive.js';
import { getTemplate, instantiate } from '../compile.js';

/**
 * One dynamic position bound to a live DOM location. `valueCount` tells the caller (see
 * `updateParts()` below) how many consecutive entries of a template's `values[]` this part
 * consumes - `1` for every part except `AttributePart`, which may span several when an attribute's
 * value mixes static text with multiple interpolations, e.g. `class="${a} ${b}"`.
 */
export interface Part {
	readonly valueCount: number;
	update(values: readonly unknown[]): void;
}

/** Feeds `values` to `parts` in document order, giving each part exactly the slice it declared via
 *  `valueCount`. Centralizing this bookkeeping here (rather than in every call site) is what lets
 *  `AttributePart` consume more than one value without the rest of the codebase knowing about it. */
export function updateParts(parts: readonly Part[], values: readonly unknown[]): void {
	let offset = 0;
	for (const part of parts) {
		part.update(values.slice(offset, offset + part.valueCount));
		offset += part.valueCount;
	}
}

/**
 * Binds an attribute's full value, which may be composed of static text segments (`literals`)
 * interleaved with any number of interpolations - mirroring how the tagged template itself is
 * structured: `literals.length === valueCount + 1`. Defaults to `['', '']` (a bare `attr="${v}"`
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
	) {
		this.valueCount = literals.length - 1;
		this.#partInfo = { type: PartType.ATTRIBUTE, element: el, name };
	}

	update(values: readonly unknown[]): void {
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

export class BooleanAttributePart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.el.toggleAttribute(this.name, Boolean(value));
	}
}

export class PropertyPart implements Part {
	readonly valueCount = 1;
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		(this.el as unknown as Record<string, unknown>)[this.name] = value;
	}
}

export class EventPart implements Part {
	readonly valueCount = 1;
	#listener: EventListenerOrEventListenerObject | undefined;
	constructor(
		private readonly el: Element,
		private readonly name: string,
		private readonly options?: AddEventListenerOptions,
	) {}
	update(values: readonly unknown[]): void {
		const value = values[0];
		if (value === this.#listener) return;
		// `removeEventListener` only needs `capture` to match the call that added the listener;
		// `once`/`passive` are ignored for removal purposes, but passing the same options is harmless.
		if (this.#listener) this.el.removeEventListener(this.name, this.#listener, this.options);
		this.#listener = typeof value === 'function' ? (value as EventListener) : undefined;
		if (this.#listener) this.el.addEventListener(this.name, this.#listener, this.options);
	}
}

/** Everything a `ChildPart` may currently hold, so it knows how to diff the next value against it. */
type ChildCommit =
	| { kind: 'none' }
	| { kind: 'text'; node: Text }
	| { kind: 'template'; strings: TemplateStringsArray; parts: Part[]; nodes: ChildNode[] }
	| { kind: 'unsafeHtml'; markup: string; nodes: ChildNode[] }
	| { kind: 'list'; items: ChildPart[] };

/** Binds a child-content position, anchored by a persistent comment node (`anchor`) in the DOM. */
export class ChildPart implements Part {
	readonly valueCount = 1;
	#committed: ChildCommit = { kind: 'none' };
	/** The `Directive` instance bound here, if a `directive()`-made value (e.g. `unsafeHTML()`) was
	 *  ever applied to this position; reused across renders - see `directive.ts`. */
	#directive: Directive | undefined;
	/** This position's `ChildPartInfo`, built once and handed to directives - see `directive.ts`. */
	#partInfo: ChildPartInfo;
	constructor(private readonly anchor: Comment) {
		this.#partInfo = { type: PartType.CHILD, anchor };
	}

	update(values: readonly unknown[]): void {
		let value = values[0];
		if (isDirectiveResult(value)) {
			const { instance, value: resolved } = applyDirective(this.#partInfo, value, this.#directive);
			this.#directive = instance;
			if (resolved === noChange) return;
			value = resolved;
		}
		if (Array.isArray(value)) this.#commitList(value);
		else if (isTemplateResult(value)) this.#commitTemplate(value);
		else if (isUnsafeHtml(value)) this.#commitUnsafeHtml(value.markup);
		else if (value == null || value === false) this.#clear();
		else this.#commitText(String(value));
	}

	#clear(): void {
		if (this.#committed.kind === 'text') this.#committed.node.remove();
		else if (this.#committed.kind === 'template') for (const n of this.#committed.nodes) n.remove();
		else if (this.#committed.kind === 'unsafeHtml') for (const n of this.#committed.nodes) n.remove();
		else if (this.#committed.kind === 'list') {
			for (const part of this.#committed.items) {
				part.#clear();
				part.anchor.remove();
			}
		}
		this.#committed = { kind: 'none' };
	}

	#commitText(text: string): void {
		if (this.#committed.kind === 'text') {
			if (this.#committed.node.data !== text) this.#committed.node.data = text;
			return;
		}
		this.#clear();
		const node = document.createTextNode(text);
		this.anchor.before(node);
		this.#committed = { kind: 'text', node };
	}

	#commitUnsafeHtml(markup: string): void {
		if (this.#committed.kind === 'unsafeHtml' && this.#committed.markup === markup) return;
		this.#clear();
		const container = document.createElement('template');
		container.innerHTML = markup;
		const nodes = Array.from(container.content.childNodes);
		this.anchor.before(container.content);
		this.#committed = { kind: 'unsafeHtml', markup, nodes };
	}

	#commitTemplate(result: TemplateResult): void {
		if (this.#committed.kind === 'template' && this.#committed.strings === result.strings) {
			updateParts(this.#committed.parts, result.values);
			return;
		}
		this.#clear();
		const { fragment, parts } = instantiate(getTemplate(result.strings, result.type));
		const nodes = Array.from(fragment.childNodes);
		this.anchor.before(fragment);
		updateParts(parts, result.values);
		this.#committed = { kind: 'template', strings: result.strings, parts, nodes };
	}

	#commitList(values: readonly unknown[]): void {
		if (this.#committed.kind !== 'list') {
			this.#clear();
			this.#committed = { kind: 'list', items: [] };
		}
		const { items } = this.#committed;

		// Shrink: drop (and clean up) any items left over from a previously-longer list.
		while (items.length > values.length) {
			const extra = items.pop()!;
			extra.#clear();
			extra.anchor.remove();
		}
		// Grow: each item gets its own anchor comment, inserted in order right before this part's anchor.
		while (items.length < values.length) {
			const itemAnchor = document.createComment('std-ui-part');
			this.anchor.before(itemAnchor);
			items.push(new ChildPart(itemAnchor));
		}

		for (let i = 0; i < values.length; i++) items[i].update([values[i]]);
	}
}
