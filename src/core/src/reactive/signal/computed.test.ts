import { describe, expect, it, vi } from 'vitest';
import { computed } from './computed.js';
import { effect } from '../effect/main.js';
import { flushEffects } from '../effect/test-helpers.js';
import { state } from './state.js';

describe('computed', () => {
	it('derives its value from signals it reads', () => {
		const a = state(2);
		const b = state(3);
		const sum = computed(() => a() + b());
		expect(sum()).toBe(5);
	});

	it('recomputes lazily when a dependency changes', () => {
		const a = state(2);
		const sum = computed(() => a() * 10);
		expect(sum()).toBe(20);
		a.set(3);
		expect(sum()).toBe(30);
	});

	it('does not recompute (cached) when read repeatedly with no dependency change', () => {
		const a = state(2);
		const spy = vi.fn(() => a() * 2);
		const doubled = computed(spy);
		doubled();
		doubled();
		doubled();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	describe('circular dependencies', () => {
		it('throws a clear error when a computed reads itself', () => {
			const self: () => number = computed(() => self() + 1);
			expect(() => self()).toThrow(/circular/i);
		});

		it('throws when two computeds read each other', () => {
			const a: () => number = computed(() => b() + 1);
			const b: () => number = computed(() => a() + 1);
			expect(() => a()).toThrow(/circular/i);
		});

		it('is not stuck after a throw: the computed recovers once the cycle is gone', () => {
			const breakCycle = state(false);
			const self: () => number = computed(() => (breakCycle() ? 42 : self()));
			expect(() => self()).toThrow(/circular/i);
			breakCycle.set(true);
			expect(self()).toBe(42);
		});

		it('does not treat a shared (diamond) dependency as a cycle', () => {
			const a = state(1);
			const b = computed(() => a() + 1);
			const c = computed(() => a() + 2);
			const d = computed(() => b() + c());
			expect(d()).toBe(5);
		});
	});

	describe('subscribes to its sources only while observed', () => {
		it('stays correct for reads made while nothing observes it', () => {
			const a = state(1);
			const doubled = computed(() => a() * 2);
			expect(doubled()).toBe(2);
			a.set(2);
			a.set(3);
			expect(doubled()).toBe(6);
		});

		it('re-verifies on re-observation: a change made while idle is not missed', async () => {
			const a = state(1);
			const doubled = computed(() => a() * 2);
			const seen: number[] = [];

			const dispose = effect(() => { seen.push(doubled()); });
			dispose(); // computed goes idle: unsubscribed from `a`
			a.set(5); // nobody is told

			const dispose2 = effect(() => { seen.push(doubled()); });
			a.set(6);
			await flushEffects();
			dispose2();
			expect(seen).toEqual([2, 10, 12]);
		});

		it('chained computeds go idle and wake up together', async () => {
			const a = state(1);
			const doubled = computed(() => a() * 2);
			const quadrupled = computed(() => doubled() * 2);
			const seen: number[] = [];

			effect(() => { seen.push(quadrupled()); })();
			a.set(2);
			effect(() => { seen.push(quadrupled()); });
			a.set(3);
			await flushEffects();
			expect(seen).toEqual([4, 8, 12]);
		});
	});

	it('propagates through chained computeds', () => {
		const a = state(1);
		const doubled = computed(() => a() * 2);
		const quadrupled = computed(() => doubled() * 2);
		expect(quadrupled()).toBe(4);
		a.set(2);
		expect(quadrupled()).toBe(8);
	});

	it('peek() reads without tracking (no dependency registered)', async () => {
		const a = state(1);
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
		const a = state(1);
		const doubled = computed(() => a() * 2);
		expect(doubled()).toBe(2);
		a.set(3);
		expect(doubled.peek()).toBe(6);
	});

	it('options.equals keeps the previous cached reference when the recomputed value is equivalent', () => {
		const a = state(1);
		const point = computed(
			() => ({ parity: a() % 2 === 0 ? 'even' : 'odd' }),
			{ equals: (x, y) => x.parity === y.parity }
		);
		const first = point();
		a.set(3); // still odd - recomputes, but equals() says it's the same as before
		expect(point()).toBe(first); // same object reference, not a freshly recomputed one
		a.set(4); // now even - genuinely different
		expect(point()).not.toBe(first);
		expect(point()).toEqual({ parity: 'even' });
	});
});
