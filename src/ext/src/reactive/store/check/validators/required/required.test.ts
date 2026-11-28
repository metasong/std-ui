import { describe, expect, it } from 'vitest';
import { store } from '../../../index.js';
import { check } from '../../main.js';
import { required } from './main.js';

describe('required', () => {
	it('fails for empty values only', () => {
		const v = required();
		for (const empty of [null, undefined, '', []]) {
			expect(v(empty)).toEqual({ flag: 'valueMissing', message: 'Required' });
		}
		for (const filled of [0, false, ' ', 'a', [0]]) expect(v(filled)).toBeNull();
	});

	it('uses a custom message and works on a node', () => {
		const s = check(store({ name: '' }));
		s.name.check.validators.set([required<string>('Name needed')]);
		expect(s.name.check.errors.get()).toEqual([{ flag: 'valueMissing', message: 'Name needed' }]);
		s.name.set('x');
		expect(s.name.check.valid.own.get()).toBe(true);
	});
});
