const unsafeHtmlTag = Symbol('unsafeHtml');

/** Wrapper produced by `unsafeHTML()`; recognized by `ChildPart` as markup to parse, not escape. */
export interface UnsafeHtml {
	readonly markup: string;
	readonly [unsafeHtmlTag]: true;
}

export function isUnsafeHtml(value: unknown): value is UnsafeHtml {
	return typeof value === 'object' && value !== null && unsafeHtmlTag in value;
}

/**
 * Escape hatch (mirrors lit-html's `unsafeHTML` directive) for injecting markup that's already
 * HTML - e.g. an SVG icon loaded via `?raw` - as a child binding, bypassing the normal
 * text-node-only handling. Caller is responsible for the markup being trusted/sanitized; this
 * does no escaping.
 *
 *   html`<button>${unsafeHTML(iconSvg)}</button>`
 */
export function unsafeHTML(markup: string): UnsafeHtml {
	return { markup, [unsafeHtmlTag]: true } as UnsafeHtml;
}
