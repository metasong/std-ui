import { Directive, directive, PartType, type PartInfo } from '../../directive.js';
import { Committer, commitWith } from '../../parts/committers/index.js';

/** Parses markup and inserts the resulting nodes before the part's anchor; re-parses only when
 *  the markup string changes. */
class UnsafeHtmlCommitter extends Committer<string> {
	#markupStr: string | undefined;
	#childNodes: ChildNode[] = [];
	update(markup: string): boolean {
		if (this.#markupStr === markup) return true;
		this.dispose();
		const container = document.createElement('template');
		container.innerHTML = markup;
		this.#childNodes = Array.from(container.content.childNodes);
		this.anchor.before(container.content);
		this.#markupStr = markup;
		return true;
	}
	dispose(): void {
		for (const n of this.#childNodes) n.remove();
		this.#childNodes = [];
	}
}

/** Validates the binding position and hands the markup to `UnsafeHtmlCommitter` via
 *  `commitWith()` - `ChildPart` has no built-in knowledge of this directive. */
class UnsafeHtmlDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui unsafeHTML(): must be bound to a child position, not an attribute.');
		}
	}

	override render(markup: string) {
		return commitWith(UnsafeHtmlCommitter, markup);
	}
}

/**
 * Escape hatch (mirrors lit-html's `unsafeHTML` directive) for injecting markup that's already
 * HTML - e.g. an SVG icon loaded via `?raw` - as a child binding, bypassing the normal
 * text-node-only handling. Caller is responsible for the markup being trusted/sanitized; this
 * does no escaping.
 *
 *   t`<button>${unsafeHTML(iconSvg)}</button>`
 */
export const unsafeHTML = directive(UnsafeHtmlDirective);
