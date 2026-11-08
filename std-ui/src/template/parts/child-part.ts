import { isTemplateResult, type TemplateResult } from '../html.js';
import { isUnsafeHtml } from '../directives/unsafe-html.js';
import {
	applyDirective,
	isDirectiveResult,
	noChange,
	PartType,
	type ChildPartInfo,
	type Directive,
} from '../directive.js';
import { getTemplate, instantiate } from '../compile.js';
import { type Part, updateParts } from './core.js';

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
