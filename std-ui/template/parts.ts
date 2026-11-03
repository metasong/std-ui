// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------
//
// Each `Part` owns one dynamic position produced by `compile.ts`/`instantiate()` and knows how to
// patch just that position when `update()` is called with a new value, no-op'ing on `Object.is`-equal
// values. See `html.ts` for the overall design.

import { isTemplateResult, type TemplateResult } from './html.js';
import { isUnsafeHtml } from './unsafe-html.js';
import { getTemplate, instantiate } from './compile.js';

export interface Part {
	update(value: unknown): void;
}

export class AttributePart implements Part {
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		if (value == null) this.el.removeAttribute(this.name);
		else this.el.setAttribute(this.name, String(value));
	}
}

export class BooleanAttributePart implements Part {
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.el.toggleAttribute(this.name, Boolean(value));
	}
}

export class PropertyPart implements Part {
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		(this.el as unknown as Record<string, unknown>)[this.name] = value;
	}
}

export class EventPart implements Part {
	#listener: EventListenerOrEventListenerObject | undefined;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (value === this.#listener) return;
		if (this.#listener) this.el.removeEventListener(this.name, this.#listener);
		this.#listener = typeof value === 'function' ? (value as EventListener) : undefined;
		if (this.#listener) this.el.addEventListener(this.name, this.#listener);
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
	#committed: ChildCommit = { kind: 'none' };
	constructor(private readonly anchor: Comment) {}

	update(value: unknown): void {
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
			for (let i = 0; i < this.#committed.parts.length; i++) this.#committed.parts[i].update(result.values[i]);
			return;
		}
		this.#clear();
		const { fragment, parts } = instantiate(getTemplate(result.strings));
		const nodes = Array.from(fragment.childNodes);
		this.anchor.before(fragment);
		for (let i = 0; i < parts.length; i++) parts[i].update(result.values[i]);
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
			const itemAnchor = document.createComment('mini-ui-part');
			this.anchor.before(itemAnchor);
			items.push(new ChildPart(itemAnchor));
		}

		for (let i = 0; i < values.length; i++) items[i].update(values[i]);
	}
}
