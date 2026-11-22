import { describe, expect, it } from 'vitest';
import { css, CSSResult, flattenCSSResults, flattenCSSText, hostSelectorsToScope, unsafeCss } from './index.js';

describe('css', () => {
	it('captures the literal text', () => {
		const result = css`button { color: red; }`;
		expect(result).toBeInstanceOf(CSSResult);
		expect(result.cssText).toBe('button { color: red; }');
	});

	it('interpolates numbers and nested CSSResults', () => {
		const radius = css`4px`;
		const result = css`button { border-radius: ${radius}; padding: ${8}px; }`;
		expect(result.cssText).toBe('button { border-radius: 4px; padding: 8px; }');
	});

	it('rejects plain strings to avoid unvetted CSS injection', () => {
		// @ts-expect-error - only CSSResult/number are allowed
		expect(() => css`button { color: ${'red'}; }`).toThrow(TypeError);
	});

	it('caches the result for literals with no interpolations (same strings identity)', () => {
		const view = () => css`button { color: blue; }`;
		expect(view()).toBe(view());
	});

	it('lazily builds and caches a CSSStyleSheet from cssText', () => {
		const result = css`button { color: green; }`;
		const sheet1 = result.styleSheet;
		const sheet2 = result.styleSheet;
		expect(sheet1).toBeInstanceOf(CSSStyleSheet);
		expect(sheet1).toBe(sheet2);
	});

	it('stringifies to cssText', () => {
		const result = css`div { display: block; }`;
		expect(`${result}`).toBe('div { display: block; }');
	});
});

describe('unsafeCss', () => {
	it('wraps an arbitrary string as a trusted CSSResult', () => {
		const result = unsafeCss('button { color: red; }');
		expect(result).toBeInstanceOf(CSSResult);
		expect(result.cssText).toBe('button { color: red; }');
	});

	it('can be interpolated into a css literal', () => {
		const dynamic = unsafeCss('red');
		const result = css`button { color: ${dynamic}; }`;
		expect(result.cssText).toBe('button { color: red; }');
	});
});

describe('flattenCSSText', () => {
	it('concatenates cssText from a lone CSSResult', () => {
		expect(flattenCSSText(css`div {}`)).toBe('div {}');
	});

	it('concatenates nested arrays of CSSResults, newline-joined, in order', () => {
		const a = css`a {}`;
		const b = css`b {}`;
		expect(flattenCSSText([a, [b]])).toBe('a {}\nb {}');
	});
});

describe('hostSelectorsToScope', () => {
	it('rewrites bare :host to :scope', () => {
		expect(hostSelectorsToScope(':host { display: block; }')).toBe(':scope { display: block; }');
	});

	it('rewrites every occurrence, leaving other text untouched', () => {
		const input = ':host { color: red; } :host(.on) { color: blue; } button {}';
		expect(hostSelectorsToScope(input)).toBe(':scope { color: red; } :scope:is(.on) { color: blue; } button {}');
	});

	it('does not touch unrelated selectors containing "host" as a substring', () => {
		expect(hostSelectorsToScope('.host-card {}')).toBe('.host-card {}');
	});
});

describe('flattenCSSResults', () => {
	it('returns a single sheet for a lone CSSResult', () => {
		const result = css`div {}`;
		expect(flattenCSSResults(result)).toEqual([result.styleSheet]);
	});

	it('flattens nested arrays of CSSResults in order', () => {
		const a = css`a {}`;
		const b = css`b {}`;
		const c = css`c {}`;
		expect(flattenCSSResults([a, [b, c]])).toEqual([a.styleSheet, b.styleSheet, c.styleSheet]);
	});
});
