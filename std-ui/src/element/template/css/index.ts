// A tiny `css` tagged template: lets stylesheets be written as
// `css\`...\`` literals, cached/shared as `CSSStyleSheet` objects, and adopted onto a shadow
// root via `adoptedStyleSheets` (see `UIElement`'s `static styles`) instead of being re-parsed
// from a `<style>` tag on every render.
//
// Usage:
//
//   const buttonStyles = css`button { color: red; }`;
//
//   @tag('my-button')
//   class MyButton extends UIElement {
//     static override shadowRootOptions = { mode: 'open' } as const;
//     static override styles = buttonStyles; // or [sharedStyles, buttonStyles]
//   }
//
// `css` values can be composed/nested like `t`:
//
//   const base = css`:host { display: block; }`;
//   const theme = css`${base} button { color: var(--accent); }`;
//
// Each distinct literal's `CSSStyleSheet` is constructed once and cached (keyed by the literal's
// `strings` identity, same trick as `html/index.ts`), then shared by reference across every component
// instance/class that uses it - cheap to "apply" (just pushes onto `adoptedStyleSheets`), and a
// single edit to the sheet (rare; not something this module does) would apply everywhere at once.

/** The result of calling `css` - a cacheable wrapper around the literal's resolved CSS text. */
export class CSSResult {
	readonly cssText: string;
	#styleSheet?: CSSStyleSheet;

	constructor(cssText: string) {
		this.cssText = cssText;
	}

	/** Lazily constructs (once) and returns the `CSSStyleSheet` for this result's `cssText`. */
	get styleSheet(): CSSStyleSheet {
		if (!this.#styleSheet) {
			this.#styleSheet = new CSSStyleSheet();
			this.#styleSheet.replaceSync(this.cssText);
		}
		return this.#styleSheet;
	}

	toString(): string {
		return this.cssText;
	}
}

export type CSSResultGroup = CSSResult | readonly CSSResultGroup[];

const cssResultCache = new WeakMap<TemplateStringsArray, CSSResult>();

/**
 * Tags a template literal as CSS. Interpolated values must themselves be `CSSResult`s (from
 * `css` or `unsafeCSS`) or plain numbers - arbitrary strings are rejected to avoid accidentally
 * splicing untrusted/dynamic text into a stylesheet (a standard guard). Use
 * `unsafeCSS()` to explicitly opt out of that check:
 * ```ts
 * css`button { color: ${unsafeCSS(userColor)}; }`
 * ```
 *
 * Note: values can contains CSSResult which is embedded by composition.
 */
export function css(strings: TemplateStringsArray, ...values: Array<CSSResult | number>): CSSResult {
	const cached = values.length === 0 ? cssResultCache.get(strings) : undefined;
	if (cached) return cached;

	// string + (value + string)*: string + (value + string) + ...
	const cssText = values.reduce<string>(
		(acc, value, i) => acc + cssValueToString(value) + strings[i + 1],
		strings[0],
	);
	const result = new CSSResult(cssText);
	if (values.length === 0) cssResultCache.set(strings, result);
	return result;
}

function cssValueToString(value: CSSResult | number): string {
	if (value instanceof CSSResult) return value.cssText;
	if (typeof value === 'number') return String(value);
	throw new TypeError(
		`Value passed to 'css' must be a 'CSSResult' (from css\`...\`/unsafeCSS()) or a number, got: ${String(value)}`,
	);
}

/** Opts a plain string (e.g. loaded at runtime) into being treated as trusted CSS, for use inside `css` literals. */
export function unsafeCSS(value: unknown): CSSResult {
	return new CSSResult(String(value));
}

/** Flattens a `CSSResultGroup` (possibly nested arrays) into a flat list of distinct `CSSStyleSheet`s, in order. */
export function flattenCSSResults(group: CSSResultGroup): CSSStyleSheet[] {
	const sheets: CSSStyleSheet[] = [];
	const visit = (g: CSSResultGroup): void => {
		if (g instanceof CSSResult) sheets.push(g.styleSheet);
		else g.forEach(visit);
	};
	visit(group);
	return sheets;
}

/** Flattens a `CSSResultGroup` (possibly nested arrays) into its concatenated `cssText`, in order. */
export function flattenCSSText(group: CSSResultGroup): string {
	const parts: string[] = [];
	const visit = (g: CSSResultGroup): void => {
		if (g instanceof CSSResult) parts.push(g.cssText);
		else g.forEach(visit);
	};
	visit(group);
	return parts.join('\n');
}

/**
 * Rewrites bare `:host` selectors to `:scope`, so the same `static styles` literal (typically
 * authored with `:host` for the shadow-DOM case) also works when adapted for light DOM via an
 * `@scope (...)` block (see `UIElement`'s light-DOM styling in `ui-element.ts`) - inside such a
 * block, `:scope` matches the scope root (the element(s) the `@scope` selector matched), exactly
 * like `:host` matches the shadow host.
 */
export function hostSelectorsToScope(cssText: string): string {
	// `:host(<sel>)` -> `:scope:is(<sel>)` (`:scope` isn't functional); allows one level of nested parens.
	return cssText
		.replace(/:host\(((?:[^()]|\([^()]*\))*)\)/g, ':scope:is($1)')
		.replace(/:host\b/g, ':scope');
}
