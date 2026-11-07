import { Directive, directive, PartType, type PartInfo } from '../directive.js';

const unsafeHtmlTag = Symbol('unsafeHtml');

/** Wrapper `UnsafeHtmlDirective.render()` returns; recognized by `ChildPart` as markup to parse,
 *  not escape, once resolved via `applyDirective()`. Consumers never see this directly - calling
 *  `unsafeHTML()` yourself gives back an opaque `DirectiveResult` (checked via
 *  `isDirectiveResult()`), not this wrapper; see `directive.ts`. */
export interface UnsafeHtml {
	readonly markup: string;
	readonly [unsafeHtmlTag]: true;
}

/** `ChildPart`'s check, after dispatching to a directive, for whether the *resolved* value is this
 *  wrapper (as opposed to text/a template/an array/etc). Not useful on `unsafeHTML()`'s own
 *  return value - that's an inert `DirectiveResult`, not yet this wrapper. */
export function isUnsafeHtml(value: unknown): value is UnsafeHtml {
	return typeof value === 'object' && value !== null && unsafeHtmlTag in value;
}

/** Validates + wraps markup for `ChildPart`; see `unsafeHTML()` below for the public API. Only
 *  `render()` is needed - `markup` is purely declarative (no DOM access required), so the default
 *  `update()` (just calls `render(...args)`) is fine as-is. */
class UnsafeHtmlDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui unsafeHTML(): must be bound to a child position, not an attribute.');
		}
	}

	override render(markup: string): UnsafeHtml {
		return { markup, [unsafeHtmlTag]: true } as UnsafeHtml;
	}
}

/**
 * Escape hatch (mirrors lit-html's `unsafeHTML` directive) for injecting markup that's already
 * HTML - e.g. an SVG icon loaded via `?raw` - as a child binding, bypassing the normal
 * text-node-only handling. Caller is responsible for the markup being trusted/sanitized; this
 * does no escaping.
 *
 *   html`<button>${unsafeHTML(iconSvg)}</button>`
 */
export const unsafeHTML = directive(UnsafeHtmlDirective);
