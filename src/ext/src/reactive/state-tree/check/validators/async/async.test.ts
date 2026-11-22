import { describe, expect, it } from 'vitest';
import { state } from '@std-ui/core';
import { stateTree } from '../../../index.js';
import { check } from '../../main.js';
import { asyncValidator } from './main.js';

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));
const taken = { flag: 'customError', message: 'taken' } as const;

function setup(lookup = async (v: string) => (v === 'bob' ? taken : null), debounce = 0) {
	const calls: string[] = [];
	const s = check(stateTree({ name: 'bob' }));
	const v = asyncValidator<string>(async (value, ctx) => {
		calls.push(value);
		return lookup(value);
	}, { debounce });
	s.name.check.validators.set([v]);
	return { s, v, calls };
}

describe('asyncValidator', () => {
	it('is pending (and not valid) until the check resolves, then reports its errors', async () => {
		const { s } = setup();
		expect(s.name.check.pending.own()).toBe(true);
		expect(s.name.check.valid.own()).toBe(false);
		expect(s.name.check.errors()).toEqual([]);
		await tick();
		expect(s.name.check.pending.own()).toBe(false);
		expect(s.name.check.errors()).toEqual([taken]);
		expect(s.name.check.valid.own()).toBe(false);
	});

	it('can be checked directly with pending() on the validator', async () => {
		const { s, v } = setup();
		expect(v.pending()).toBe(false); // node has not asked yet
		s.name.check.valid.own(); // node reads it, which starts the check
		await Promise.resolve();
		expect(v.pending()).toBe(true);
		await tick();
		expect(v.pending()).toBe(false);
		s.name.set('ann');
		s.name.check.valid.own();
		await Promise.resolve();
		expect(v.pending()).toBe(true);
		await tick();
		expect(v.pending()).toBe(false);
	});

	it('re-checks when a signal read in deps changes', async () => {
		const country = state('NL');
		const calls: string[] = [];
		const s = check(stateTree({ name: 'bob' }));
		s.name.check.validators.set([
			asyncValidator<string, string>(
				async (value, { deps }) => {
					calls.push(`${value}@${deps}`);
					return null;
				},
				{ deps: () => country() },
			),
		]);
		s.name.check.pending.own();
		await tick();
		expect(s.name.check.valid.own()).toBe(true);
		country.set('BE');
		expect(s.name.check.pending.own()).toBe(true);
		expect(s.name.check.valid.own()).toBe(false);
		await tick();
		expect(s.name.check.valid.own()).toBe(true);
		expect(calls).toEqual(['bob@NL', 'bob@BE']);
	});

	it('becomes valid when the check passes', async () => {
		const { s } = setup();
		s.name.set('ann');
		expect(s.name.check.valid.own()).toBe(false);
		await tick();
		expect(s.name.check.valid.own()).toBe(true);
		expect(s.name.check.errors()).toEqual([]);
	});

	it('checks each value once and ignores stale results', async () => {
		let release!: () => void;
		const gate = new Promise<void>((r) => (release = r));
		const { s, calls } = setup(async (v) => {
			if (v === 'bob') await gate; // slow, will be superseded
			return v === 'bob' ? taken : null;
		});
		s.name.check.pending.own();
		await tick();
		s.name.set('ann');
		s.name.check.pending.own();
		await tick();
		release();
		await tick();
		expect(calls).toEqual(['bob', 'ann']);
		expect(s.name.check.errors()).toEqual([]);
		expect(s.name.check.valid.own()).toBe(true);
	});

	it('debounces rapid changes into one check', async () => {
		const { s, calls } = setup(undefined, 20);
		for (const v of ['a', 'ab', 'abc']) {
			s.name.set(v);
			s.name.check.pending.own();
		}
		await tick(60);
		expect(calls).toEqual(['abc']);
	});

	it('aggregates into valid / pending on parents', async () => {
		const s = check(stateTree({ user: { name: 'ann' } }));
		s.user.name.check.validators.set([asyncValidator<string>(async () => null)]);
		expect(s.check.pending()).toBe(true);
		expect(s.check.valid()).toBe(false);
		expect(s.user.check.valid.own()).toBe(true); // own validators only: none on `user`
		await tick();
		expect(s.check.pending()).toBe(false);
		expect(s.check.valid()).toBe(true);
	});

	it('maps a rejected check through onError, or a default error', async () => {
		const s = check(stateTree({ n: 'x' }));
		const fail = async (): Promise<never> => {
			throw new Error('net');
		};
		s.n.check.validators.set([asyncValidator<string>(fail)]);
		s.n.check.pending.own();
		await tick();
		expect(s.n.check.errors()).toEqual([{ flag: 'customError', message: 'Validation failed' }]);

		const s2 = check(stateTree({ n: 'x' }));
		s2.n.check.validators.set([
			asyncValidator<string>(fail, { onError: () => ({ flag: 'customError', message: 'offline' }) }),
		]);
		s2.n.check.pending.own();
		await tick();
		expect(s2.n.check.errors()).toEqual([{ flag: 'customError', message: 'offline' }]);
	});
});
