import { describe, expect, it } from 'vitest';
import { signalState } from '../../../main.js';
import { max, min } from './main.js';

describe('range validators', () => {
	it('min / max are inclusive and skip nullish values', () => {
		expect(min(1)(0)).toEqual({ flag: 'rangeUnderflow', message: 'Must be at least 1' });
		expect(min(1)(1)).toBeNull();
		expect(max(5, 'big')(6)).toEqual({ flag: 'rangeOverflow', message: 'big' });
		expect(max(5)(5)).toBeNull();
		expect(min(1)(null)).toBeNull();
		expect(max(5)(undefined)).toBeNull();
	});

	it('works on a node', () => {
		const s = signalState({ age: -1 });
		s.age.check.validators.set([min<number>(0), max<number>(120)]);
		expect(s.age.check.errors().map((e) => e.flag)).toEqual(['rangeUnderflow']);
		s.age.set(121);
		expect(s.age.check.errors().map((e) => e.flag)).toEqual(['rangeOverflow']);
		s.age.set(30);
		expect(s.age.check.valid()).toBe(true);
	});
});
