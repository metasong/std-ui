import { describe, expect, it } from 'vitest';
import { state } from '@std-ui/core';
import { check } from './main.js';
import { minLength } from './validators/length/main.js';
import { required } from './validators/required/main.js';

describe('check.itemValidators', () => {
	const make = (tags: string[]) => {
		const s = check(state({ tags }));
		s.tags.check.itemValidators.set([required<string>('empty'), minLength<string>(3)]);
		return s;
	};

	it('applies to existing items, reported on the array with the item index as path', () => {
		const s = make(['abc', '', 'ab']);
		expect(s.tags.check.valid()).toBe(false);
		expect(s.tags.check.errors.all().map((e) => [e.path, e.message])).toEqual([
			[[1], 'empty'],
			[[2], expect.any(String)],
		]);
		expect(s.tags.check.errors()).toEqual([]); // the array's own errors are separate
	});

	it('an item node reports the inherited errors itself', () => {
		const s = make(['abc', '']);
		expect(s.tags.at(0)!.check.valid.own()).toBe(true);
		expect(s.tags.at(1)!.check.errors()[0].message).toBe('empty');
	});

	it('items added later get the rules, and fixing an item makes the array valid', () => {
		const s = make(['abc']);
		expect(s.tags.check.valid()).toBe(true);
		s.tags.push('');
		expect(s.tags.check.valid()).toBe(false);
		s.tags.at(1)!.set('abcd');
		expect(s.tags.check.valid()).toBe(true);
	});

	it('changing the rules re-evaluates; items keep their own validators too', () => {
		const s = make(['abc']);
		s.tags.at(0)!.check.validators.set([minLength<string>(5)]);
		expect(s.tags.at(0)!.check.valid.own()).toBe(false);
		s.tags.check.itemValidators.set([]);
		s.tags.at(0)!.check.validators.set([]);
		expect(s.tags.check.valid()).toBe(true);
	});
});
