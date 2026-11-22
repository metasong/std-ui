import { describe, expect, it, vi } from 'vitest';
import { effect } from '../effect/main.js';
import { flushEffects } from '../effect/test-helpers.js';
import { state } from './state.js';

describe('signal', () => {
	it('reads back the initial value', () => {
		const count = state(5);
		expect(count()).toBe(5);
	});

	it('set() updates the value read back', () => {
		const count = state(1);
		count.set(2);
		expect(count()).toBe(2);
	});

	it('update() derives the next value from the previous one and returns it', () => {
		const count = state(1);
		const next = count.update(n => n + 1);
		expect(next).toBe(2);
		expect(count()).toBe(2);
	});

	it('peek() reads without tracking (no dependency registered)', async () => {
		const count = state(1);
		const spy = vi.fn();
		effect(() => {
			count.peek();
			spy();
		});
		await flushEffects();
		spy.mockClear();

		count.set(2);
		await flushEffects();
		expect(spy).not.toHaveBeenCalled();
	});

	it('set() is a no-op for an Object.is-equal value (no notification)', async () => {
		const count = state(1);
		const spy = vi.fn();
		effect(() => {
			count();
			spy();
		});
		await flushEffects();
		spy.mockClear();

		count.set(1);
		await flushEffects();
		expect(spy).not.toHaveBeenCalled();
	});

	it('options.equals overrides the default Object.is change check', async () => {
		// Case-insensitive string signal: setting a value that only differs by case is a no-op.
		const name = state('Ada', { equals: (a, b) => a.toLowerCase() === b.toLowerCase() });
		const spy = vi.fn();
		effect(() => {
			name();
			spy();
		});
		await flushEffects();
		spy.mockClear();

		name.set('ADA');
		await flushEffects();
		expect(spy).not.toHaveBeenCalled();
		expect(name()).toBe('Ada'); // unchanged - equals() said it was the same value

		name.set('Lin');
		await flushEffects();
		expect(spy).toHaveBeenCalledTimes(1);
		expect(name()).toBe('Lin');
	});
});
