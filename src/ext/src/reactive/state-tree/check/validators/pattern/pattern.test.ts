import { describe, expect, it } from 'vitest';
import { stateTree } from '../../../index.js';
import { check } from '../../main.js';
import { email, pattern } from './main.js';

describe('pattern validators', () => {
	it('pattern fails on mismatch and skips empty values', () => {
		const v = pattern(/^\d+$/, 'digits only');
		expect(v('12a')).toEqual({ flag: 'patternMismatch', message: 'digits only' });
		expect(v('123')).toBeNull();
		expect(v('')).toBeNull();
		expect(v(null as never)).toBeNull();
	});

	it('is safe with global regexes', () => {
		const v = pattern(/a/g);
		expect(v('a')).toBeNull();
		expect(v('a')).toBeNull();
	});

	it('email checks the basic shape', () => {
		const v = email();
		expect(v('nope')).toEqual({ flag: 'typeMismatch', message: 'Invalid email' });
		expect(v('a@b')).toMatchObject({ flag: 'typeMismatch' });
		expect(v('a@b.co')).toBeNull();
		expect(v('')).toBeNull();
	});

	it('works on a node', () => {
		const s = check(stateTree({ mail: 'x' }));
		s.mail.check.validators.set([email<string>()]);
		expect(s.mail.check.valid.own()).toBe(false);
		s.mail.set('x@y.z');
		expect(s.mail.check.valid.own()).toBe(true);
	});
});
