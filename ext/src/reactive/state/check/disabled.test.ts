import { describe, expect, it } from 'vitest';
import { state } from '@std-ui/core';
import { formUi } from '../form-ui/main.js';
import { check } from './main.js';
import { required } from './validators/required/main.js';

describe('check follows formUi.disabled', () => {
	const make = () => {
		const s = check(formUi(state({ a: '', b: '' })));
		s.a.check.validators.set([required<string>()]);
		s.b.check.validators.set([required<string>()]);
		return s;
	};

	it('a disabled node is not validated, and re-enables reactively', () => {
		const s = make();
		expect(s.a.check.valid.own()).toBe(false);
		s.a.formUi.disabled.own.set(true);
		expect(s.a.check.errors()).toEqual([]);
		expect(s.a.check.valid.own()).toBe(true);
		expect(s.b.check.valid.own()).toBe(false);
		s.a.formUi.disabled.own.set(false);
		expect(s.a.check.valid.own()).toBe(false);
	});

	it('inherits from a disabled ancestor', () => {
		const s = make();
		s.formUi.disabled.own.set(true);
		expect(s.check.valid()).toBe(true);
		expect(s.b.check.errors()).toEqual([]);
	});
});
