import { describe, expect, it } from 'vitest';
import { isUnsafeHtml, unsafeHTML } from './unsafe-html.js';

describe('unsafeHTML', () => {
	it('wraps the markup, retrievable via .markup', () => {
		const wrapped = unsafeHTML('<b>hi</b>');
		expect(wrapped.markup).toBe('<b>hi</b>');
	});
});

describe('isUnsafeHtml', () => {
	it('is true for unsafeHTML() results', () => {
		expect(isUnsafeHtml(unsafeHTML('<b>hi</b>'))).toBe(true);
	});

	it('is false for plain strings/values, even HTML-looking ones', () => {
		expect(isUnsafeHtml('<b>hi</b>')).toBe(false);
		expect(isUnsafeHtml(42)).toBe(false);
		expect(isUnsafeHtml(null)).toBe(false);
		expect(isUnsafeHtml(undefined)).toBe(false);
		expect(isUnsafeHtml({})).toBe(false);
		expect(isUnsafeHtml({ markup: '<b>hi</b>' })).toBe(false);
	});
});
