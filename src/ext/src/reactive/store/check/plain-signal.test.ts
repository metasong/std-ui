import { describe, expect, it } from 'vitest';
import { Signal } from 'signal-polyfill';
import { computed, state } from '@std-ui/core';
import { check } from './index.js';

// `check` on plain signals (`state()`, `computed()`, a raw `Signal.State`), not store nodes.

describe('check: plain signals', () => {
	it('errors and valid follow the value', () => {
		const age = state(5).with(check);
		age.check.validators.set([(v) => (v < 18 ? { flag: 'rangeUnderflow', message: 'too young' } : null)]);
		expect(age.check.errors.get()).toEqual([{ flag: 'rangeUnderflow', message: 'too young' }]);
		expect(age.check.errors.all.get()).toEqual([{ flag: 'rangeUnderflow', message: 'too young', path: [] }]);
		age.set(20);
		expect(age.check.errors.get()).toEqual([]);
		expect(age.check.valid.own.get()).toBe(true);
	});

	it('validates a state() and, separately, a computed() built from it', () => {
		const name = check(state(''));
		name.check.validators.set([(v) => (v ? null : { flag: 'valueMissing', message: 'x' })]);
		expect(name.check.valid.get()).toBe(false);
		name.set('a');
		expect(name.check.valid.get()).toBe(true);

		const len = check(computed(() => name.get().length));
		len.check.validators.set([(v) => (v > 3 ? { flag: 'tooLong', message: 'x' } : null)]);
		expect(len.check.valid.get()).toBe(true);
	});

	it('a computed is re-validated when its source changes', () => {
		const text = state('abc');
		const len = computed(() => text.get().length).with(check);
		len.check.validators.set([(v) => (v > 3 ? { flag: 'tooLong', message: 'long' } : null)]);
		expect(len.check.valid.get()).toBe(true);
		text.set('abcd');
		expect(len.check.valid.get()).toBe(false);
	});

	it('enabled = false switches validation off', () => {
		const s = state('').with(check);
		s.check.validators.set([(v) => (v ? null : { flag: 'valueMissing', message: 'x' })]);
		expect(s.check.valid.get()).toBe(false);
		s.check.enabled.set(false);
		expect(s.check.valid.get()).toBe(true);
		expect(s.check.errors.get()).toEqual([]);
	});

	it('works on a raw Signal.State', () => {
		const s = check(new Signal.State(''));
		s.check.validators.set([(v) => (v ? null : { flag: 'valueMissing', message: 'x' })]);
		expect(s.check.valid.get()).toBe(false);
		s.set('a');
		expect(s.check.valid.get()).toBe(true);
	});
});
