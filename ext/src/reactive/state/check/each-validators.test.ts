import { describe, expect, it } from 'vitest';
import { state } from '@std-ui/core';
import { check } from './main.js';
import { minLength } from './validators/length/main.js';
import { required } from './validators/required/main.js';

describe('check.eachValidators', () => {
	const make = (tags: string[]) => {
		const s = check(state({ tags }));
		s.tags.check.eachValidators.set([required<string>('empty'), minLength<string>(3)]);
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
		s.tags.check.eachValidators.set([]);
		s.tags.at(0)!.check.validators.set([]);
		expect(s.tags.check.valid()).toBe(true);
	});
});

describe('check.eachValidators on objects', () => {
	it('applies to every member of a record-like object, including keys added later', () => {
		const s = check(state<Record<string, string>>({ en: 'hello', de: '' }));
		s.check.eachValidators.set([required<string>('empty')]);
		expect(s.check.valid()).toBe(false);
		expect(s.check.errors.all().map((e) => e.path)).toEqual([['de']]);
		s.de.set('hallo');
		expect(s.check.valid()).toBe(true);
		s.set({ fr: '' });
		expect(s.check.valid()).toBe(false);
	});
});

describe('check.fields', () => {
	const make = () => {
		const s = check(state({ name: '', age: 5 }));
		s.check.fields({
			name: [required<string>('Name needed')],
			age: [(v) => (v >= 18 ? undefined : { flag: 'rangeUnderflow', message: 'Adults only' })],
		});
		return s;
	};

	it('sets validators per member in one call', () => {
		const s = make();
		expect(s.name.check.errors()[0].message).toBe('Name needed');
		expect(s.check.errors.all().map((e) => e.path)).toEqual([['name'], ['age']]);
		s.name.set('Ada');
		s.age.set(30);
		expect(s.check.valid()).toBe(true);
	});

	it('keeps the member\'s own validators and can be replaced', () => {
		const s = make();
		s.name.check.validators.set([minLength<string>(5)]);
		s.name.set('Ada');
		expect(s.name.check.errors()).toHaveLength(1); // own rule still applies
		s.check.fields({});
		s.name.set('');
		expect(s.name.check.valid.own()).toBe(true); // required came from the old fields(...)
	});

	it('applies to a member added later', () => {
		const s = check(state<Record<string, string>>({}));
		s.check.fields({ a: [required<string>('a needed')] });
		s.set({ a: '' });
		expect(s.check.valid()).toBe(false);
		s.a.set('x');
		expect(s.check.valid()).toBe(true);
	});
});