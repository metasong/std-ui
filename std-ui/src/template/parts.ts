// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `compile.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

import { isTemplateResult, type TemplateResult } from './html.js';
import { isUnsafeHtml } from './unsafe-html.js';
import { getTemplate, instantiate } from './compile.js';

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
	constructor(
		private readonly el: Element,
		private readonly name: string,
		private readonly literals: readonly string[] = ['', ''],
	) {
		this.valueCount = literals.length - 1;
	}

	update(values: readonly unknown[]): void {
		const isBareSingleValue = this.literals.length === 2 && this.literals[0] === '' && this.literals[1] === '';
		if (isBareSingleValue && values[0] == null) {
			if (this.#committed === null) return;
			this.#committed = null;
			this.el.removeAttribute(this.name);
			return;
		}

		let composed = this.literals[0];
		for (let i = 0; i < values.length; i++) composed += (values[i] == null ? '' : String(values[i])) + this.literals[i + 1];

		if (composed === this.#committed) return;
		this.#committed = composed;
		this.el.setAttribute(this.name, composed);
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
	constructor(private readonly anchor: Comment) {}

	update(values: readonly unknown[]): void {
		const value = values[0];
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
