import { describe, expect, it } from 'vitest';
import { signalState } from '../../main.js';
import { manualValidator } from './main.js';

const err = (message: string) => ({ kind: 'server', message });

describe('manualValidator', () => {
	it('reports set errors and removes them on clear', () => {
		const s = signalState({ email: 'a@b.c' });
		const v = manualValidator<string>();
		s.email.check.validators.set([v]);
		expect(s.email.check.valid()).toBe(true);
		v.set(err('taken'));
		expect(s.email.check.errors()).toEqual([err('taken')]);
		expect(s.check.allErrors()).toEqual([{ ...err('taken'), path: ['email'] }]);
		v.clear();
		expect(s.email.check.errors()).toEqual([]);
	});

	it('set replaces earlier errors; empty list clears', () => {
		const s = signalState({ n: 'x' });
		const v = manualValidator<string>();
		s.n.check.validators.set([v]);
		v.set([err('a'), err('b')]);
		v.set(err('c'));
		expect(s.n.check.errors()).toEqual([err('c')]);
		v.set([]);
		expect(s.n.check.errors()).toEqual([]);
	});

	it('errors drop once the value changes and do not come back', () => {
		const s = signalState({ n: 'x' });
		const v = manualValidator<string>();
		s.n.check.validators.set([v]);
		v.set(err('bad'));
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
		a.set(err('a'));
		b.set(err('b'));
		expect(s.n.check.errors()).toEqual([err('a'), err('b')]);
		a.clear();
		expect(s.n.check.errors()).toEqual([err('b')]);
	});
});
