import { Directive, directive, type DirectivePart, type PartInfo } from '../directive.js';
import { PartType } from '../../parts/part.js';
import { ChildRenderer, renderWith } from '../../parts/renderers/index.js';

/** Parses markup and inserts the resulting nodes before the DirectivePart's anchor; re-parses only when
 *  the markup string changes. */
class UnsafeHtmlRenderer extends ChildRenderer<string> {
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

/** Validates the binding position and hands the markup to `UnsafeHtmlRenderer` via
 *  `renderWith()` - `ChildPart` has no built-in knowledge of this directive. */
class UnsafeHtmlDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui unsafeHtml(): must be bound to a child position, not an attribute.');
		}
	}

	override update(_part: DirectivePart, markup: string) {
		return renderWith(UnsafeHtmlRenderer, markup);
	}
}

/**
 * Unsafe HTML directive: Caller is responsible for the markup being trusted/sanitized; this
 * does no escaping.
 *
 * Escape hatch for injecting markup that's already
 * HTML string - e.g. an SVG icon loaded via `?raw` - as a child binding, bypassing the normal
 * text-node-only handling.
 *
 *   t`<button>${unsafeHtml(iconSvg)}</button>`
 *
 * UNSAFE: the string is parsed with `innerHTML` and inserted as live DOM, with no sanitizing.
 * Never pass untrusted input (user data, query params, third-party content). Injected markup can
 * run script (XSS) and, for example:
 * - inline handlers: `<img src=x onerror="...">`, `<svg onload="...">`;
 * - `javascript:` URLs: `<a href="javascript:...">`;
 * - script-capable embeds: `<iframe srcdoc>`, `<object>`, `<embed>`;
 * - steal cookies/`localStorage`, call APIs as the user, log keystrokes;
 * - spoof the UI (fake login forms, overlays) even with no JS.
 * Only use with constants or content you control; otherwise sanitize first (e.g. DOMPurify).
 */
export const unsafeHtml = directive(UnsafeHtmlDirective);
