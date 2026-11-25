import { describe, expect, it, vi } from 'vitest';
import { state } from '@std-ui/core';
import { stateTree } from '../../../index.js';
import { check } from '../../main.js';
import { asyncValidator } from '../async/main.js';
import { minLength } from '../length/main.js';
import { required } from '../required/main.js';
import { when } from './main.js';

describe('when', () => {
	it('applies only while enabled, reactively', () => {
		const on = state(false);
		const s = check(stateTree({ name: '' }));
		s.name.check.validators.set([when(on, required<string>())]);
		expect(s.name.check.errors.get()).toEqual([]);
		on.set(true);
		expect(s.name.check.errors.get()).toHaveLength(1);
		expect(s.name.check.valid.own.get()).toBe(false);
		on.set(false);
		expect(s.name.check.valid.own.get()).toBe(true);
	});

	it('node-level enabled switches all own validators off', () => {
		const s = check(stateTree({ name: '' }));
		s.name.check.validators.set([required<string>()]);
		expect(s.name.check.valid.own.get()).toBe(false);
		s.name.check.enabled.set(false);
		expect(s.name.check.errors.get()).toEqual([]);
		expect(s.name.check.valid.get()).toBe(true);
		s.name.check.enabled.set(true);
		expect(s.name.check.valid.get()).toBe(false);
	});

	it('null means always enabled and returns the validator unchanged', () => {
		const v = required<string>();
		expect(when(null, v)).toBe(v);
	});

	it('wraps several validators with one condition', () => {
		const on = state(true);
		const v = when(on, [required<string>(), minLength<string>(3)]);
		expect(v('')).toHaveLength(1);
		expect(v('a')).toHaveLength(1);
		on.set(false);
		expect(v('a')).toBeNull();
	});

	it('disabled async validator is not pending and starts no request', async () => {
		const on = state(false);
		const fn = vi.fn(async () => null);
		const s = check(stateTree({ name: 'x' }));
		s.name.check.validators.set([when(on, asyncValidator<string>(fn))]);
		expect(s.name.check.pending.own.get()).toBe(false);
		expect(s.name.check.valid.own.get()).toBe(true);
		await new Promise((r) => setTimeout(r, 10));
		expect(fn).not.toHaveBeenCalled();
		on.set(true);
		expect(s.name.check.pending.own.get()).toBe(true);
		await new Promise((r) => setTimeout(r, 10));
		expect(fn).toHaveBeenCalledTimes(1);
		expect(s.name.check.pending.own.get()).toBe(false);
	});
});
