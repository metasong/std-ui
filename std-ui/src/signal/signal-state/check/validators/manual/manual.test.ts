import { describe, expect, it } from 'vitest';
import { flags } from '../../../flags.js';
import { signalState } from '../../../main.js';
import { manualValidator } from './main.js';

const err = (message: string) => ({ flag: 'customError', message });

describe('manualValidator', () => {
	it('reports set messages as customError and removes them on clear', () => {
		const s = signalState({ email: 'a@b.c' });
		const v = manualValidator<string>();
		s.email.check.validators.set([v]);
		expect(s.email.check.valid()).toBe(true);
		v.set('taken');
		expect(s.email.check.errors()).toEqual([err('taken')]);
		expect(s.check.allErrors()).toEqual([{ ...err('taken'), path: ['email'] }]);
		v.clear();
		expect(s.email.check.errors()).toEqual([]);
	});

	it('accepts errors with their own flag, mixed with messages', () => {
		const s = signalState({ n: 'x' });
		const v = manualValidator<string>();
		s.n.check.validators.set([v]);
		v.set({ flag: flags.tooLong, message: 'long' });
		expect(s.n.check.errors()).toEqual([{ flag: 'tooLong', message: 'long' }]);
		v.set(['plain', { flag: flags.badInput, message: 'bad' }]);
		expect(s.n.check.errors()).toEqual([err('plain'), { flag: 'badInput', message: 'bad' }]);
		// @ts-expect-error free-form flags are not allowed
		v.set({ flag: 'server', message: 'nope' });
	});

	it('set replaces earlier errors; empty list clears', () => {
		const s = signalState({ n: 'x' });
		const v = manualValidator<string>();
		s.n.check.validators.set([v]);
		v.set(['a', 'b']);
		expect(s.n.check.errors()).toEqual([err('a'), err('b')]);
		v.set('c');
		expect(s.n.check.errors()).toEqual([err('c')]);
		v.set([]);
		expect(s.n.check.errors()).toEqual([]);
	});

	it('errors drop once the value changes and do not come back', () => {
		const s = signalState({ n: 'x' });
		const v = manualValidator<string>();
		s.n.check.validators.set([v]);
		v.set('bad');
		expect(s.n.check.valid()).toBe(false);
		s.n.set('y');
		expect(s.n.check.valid()).toBe(true);
		s.n.set('x');
		expect(s.n.check.valid()).toBe(true);
	});

	it('several manual validators are independent', () => {
		const s = signalState({ n: 'x' });
		const a = manualValidator<string>();
		const b = manualValidator<string>();
		s.n.check.validators.set([a, b]);
		a.set('a');
		b.set('b');
		expect(s.n.check.errors()).toEqual([err('a'), err('b')]);
		a.clear();
		expect(s.n.check.errors()).toEqual([err('b')]);
	});
});
