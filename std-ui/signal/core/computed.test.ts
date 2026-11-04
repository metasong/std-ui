import { describe, expect, it, vi } from 'vitest';
import { computed } from './computed.js';
import { effect } from './effect.js';
import { signal } from './signal.js';
import { flushEffects } from './test-helpers.js';

describe('computed', () => {
	it('derives its value from signals it reads', () => {
		const a = signal(2);
		const b = signal(3);
		const sum = computed(() => a() + b());
		expect(sum()).toBe(5);
	});

	it('recomputes lazily when a dependency changes', () => {
		const a = signal(2);
		const sum = computed(() => a() * 10);
		expect(sum()).toBe(20);
		a.set(3);
		expect(sum()).toBe(30);
	});

	it('does not recompute (cached) when read repeatedly with no dependency change', () => {
		const a = signal(2);
		const spy = vi.fn(() => a() * 2);
		const doubled = computed(spy);
		doubled();
		doubled();
		doubled();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('propagates through chained computeds', () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		const quadrupled = computed(() => doubled() * 2);
		expect(quadrupled()).toBe(4);
		a.set(2);
		expect(quadrupled()).toBe(8);
	});

	it('peek() reads without tracking (no dependency registered)', async () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		doubled(); // warm cache
		const spy = vi.fn();
		effect(() => {
			doubled.peek();
			spy();
		});
		await flushEffects();
		spy.mockClear();

		a.set(2);
		await flushEffects();
		expect(spy).not.toHaveBeenCalled();
	});

	it('peek() still recomputes when dirty and returns the fresh value', () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		expect(doubled()).toBe(2);
		a.set(3);
		expect(doubled.peek()).toBe(6);
	});
});
