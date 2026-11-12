import { describe, expect, it } from 'vitest';
import { signalState } from '../../main.js';
import { maxLength, minLength } from './main.js';

describe('length validators', () => {
	it('minLength checks strings and arrays, skipping empty values', () => {
		const v = minLength(3);
		expect(v('ab')).toEqual({ flag: 'tooShort', message: 'At least 3 characters' });
		expect(v([1])).toMatchObject({ flag: 'tooShort' });
		expect(v('abc')).toBeNull();
		expect(v('')).toBeNull();
		expect(v(null)).toBeNull();
	});

	it('maxLength checks strings and arrays', () => {
		const v = maxLength(2, 'too long');
		expect(v('abc')).toEqual({ flag: 'tooLong', message: 'too long' });
		expect(v([1, 2, 3])).toMatchObject({ flag: 'tooLong' });
		expect(v('ab')).toBeNull();
		expect(v(undefined)).toBeNull();
	});

	it('works together on a node', () => {
		const s = signalState({ pw: 'a' });
		s.pw.check.validators.set([minLength<string>(3), maxLength<string>(5)]);
		expect(s.pw.check.errors().map((e) => e.flag)).toEqual(['tooShort']);
		s.pw.set('abcdef');
		expect(s.pw.check.errors().map((e) => e.flag)).toEqual(['tooLong']);
		s.pw.set('abcd');
		expect(s.pw.check.valid()).toBe(true);
	});
});
