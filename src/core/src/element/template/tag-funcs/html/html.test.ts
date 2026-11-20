import { describe, expect, it } from 'vitest';
import { t, isTemplateResult, svg } from './index.js';

describe('t', () => {
	it('captures strings/values without doing any DOM work', () => {
		const result = t`<p>Hello, ${'Ada'}!</p>`;
		expect(result.values).toEqual(['Ada']);
		expect(Array.from(result.strings)).toEqual(['<p>Hello, ', '!</p>']);
		expect(result.type).toBeUndefined();
	});

	it('reuses the same `strings` identity across calls at the same call site', () => {
		const view = (name: string) => t`<p>${name}</p>`;
		const a = view('Ada');
		const b = view('Grace');
		expect(a.strings).toBe(b.strings);
	});

	it('gives different call sites different `strings` identities', () => {
		const a = t`<p>${1}</p>`;
		const b = t`<p>${1}</p>`;
		expect(a.strings).not.toBe(b.strings);
	});

	it('captures nested t() results in values when embedding a template part', () => {
		const badge = t`<span>${'new'}</span>`;
		const outer = t`<div class="row">${badge}</div>`;
		expect(outer.values).toEqual([badge]);
		expect(isTemplateResult(outer.values[0])).toBe(true);
	});
});

describe('svg', () => {
	it('captures strings/values and tags the result with type "svg"', () => {
		const result = svg`<circle r=${3} />`;
		expect(result.values).toEqual([3]);
		expect(result.type).toBe('svg');
	});
});

describe('isTemplateResult', () => {
	it('is true for t()/svg() results', () => {
		expect(isTemplateResult(t`<p></p>`)).toBe(true);
		expect(isTemplateResult(svg`<circle />`)).toBe(true);
	});

	it('is false for plain values', () => {
		expect(isTemplateResult('hello')).toBe(false);
		expect(isTemplateResult(42)).toBe(false);
		expect(isTemplateResult(null)).toBe(false);
		expect(isTemplateResult(undefined)).toBe(false);
		expect(isTemplateResult({})).toBe(false);
		expect(isTemplateResult({ strings: [] })).toBe(false);
	});
});
