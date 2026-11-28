import { describe, expect, it } from 'vitest';
import { store } from '../index.js';
import { formUi } from '../form-ui/main.js';
import { check } from './main.js';
import { required } from './validators/required/main.js';

describe('check follows formUi.disabled', () => {
	const make = () => {
		const s = check(formUi(store({ a: '', b: '' })));
		s.a.check.validators.set([required<string>()]);
		s.b.check.validators.set([required<string>()]);
		return s;
	};

	it('a disabled node is not validated, and re-enables reactively', () => {
		const s = make();
		expect(s.a.check.valid.own.get()).toBe(false);
		s.a.formUi.disabled.own.set(true);
		expect(s.a.check.errors.get()).toEqual([]);
		expect(s.a.check.valid.own.get()).toBe(true);
		expect(s.b.check.valid.own.get()).toBe(false);
		s.a.formUi.disabled.own.set(false);
		expect(s.a.check.valid.own.get()).toBe(false);
	});

	it('inherits from a disabled ancestor', () => {
		const s = make();
		s.formUi.disabled.own.set(true);
		expect(s.check.valid.get()).toBe(true);
		expect(s.b.check.errors.get()).toEqual([]);
	});
});
