import { describe, expect, it, vi } from 'vitest';
import { effect } from './effect.js';
import { signal } from './signal.js';
import { flushEffects } from './test-helpers.js';

describe('signal', () => {
	it('reads back the initial value', () => {
		const count = signal(5);
		expect(count()).toBe(5);
	});

	it('set() updates the value read back', () => {
		const count = signal(1);
		count.set(2);
		expect(count()).toBe(2);
	});

	it('update() derives the next value from the previous one and returns it', () => {
		const count = signal(1);
		const next = count.update(n => n + 1);
		expect(next).toBe(2);
		expect(count()).toBe(2);
	});

	it('peek() reads without tracking (no dependency registered)', async () => {
		const count = signal(1);
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
		const count = signal(1);
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
});
