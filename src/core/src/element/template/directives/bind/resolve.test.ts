import { describe, expect, it } from 'vitest';
import { state } from '../../../../reactive/index.js';
import { BindingCache } from './resolve.js';

describe('BindingCache', () => {
	const input = () => document.createElement('input');

	it('returns the same binding for the same state, options, element and property', () => {
		const cache = new BindingCache();
		const s = state('a');
		const el = input();
		const options = { event: 'change' };
		expect(cache.resolve([s, options], el, 'value')).toBe(cache.resolve([s, options], el, 'value'));
	});

	it('re-resolves when state, options, element or property changes', () => {
		const cache = new BindingCache();
		const s = state('a');
		const el = input();
		const base = cache.resolve([s], el, 'value');
		expect(cache.resolve([state('a')], el, 'value')).not.toBe(base);
		const withState = cache.resolve([s], el, 'value');
		expect(cache.resolve([s, {}], el, 'value')).not.toBe(withState);
		const withOptions = cache.resolve([s, {}], el, 'value');
		expect(cache.resolve([s, {}], el, 'value')).not.toBe(withOptions);
		const sameArgs = [s] as const;
		const first = cache.resolve(sameArgs, el, 'value');
		expect(cache.resolve(sameArgs, input(), 'value')).not.toBe(first);
		const onEl = cache.resolve(sameArgs, el, 'value');
		expect(cache.resolve(sameArgs, el, 'checked')).not.toBe(onEl);
	});

	it('never caches accessor objects', () => {
		const cache = new BindingCache();
		const el = input();
		const accessor = { get: () => 'x', set: () => {} };
		expect(cache.resolve([accessor], el, 'value')).not.toBe(cache.resolve([accessor], el, 'value'));
	});

	it('re-resolves after clear()', () => {
		const cache = new BindingCache();
		const s = state('a');
		const el = input();
		const before = cache.resolve([s], el, 'value');
		cache.clear();
		expect(cache.resolve([s], el, 'value')).not.toBe(before);
	});
});
