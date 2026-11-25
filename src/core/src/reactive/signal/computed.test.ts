import { describe, expect, it, vi } from 'vitest';
import { computed, type Computed } from './computed.js';
import { effect } from '../effect/main.js';
import { flushEffects } from '../effect/test-helpers.js';
import { state } from './state.js';

describe('computed', () => {
	it('derives its value from signals it reads', () => {
		const a = state(2);
		const b = state(3);
		const sum = computed(() => a.get() + b.get());
		expect(sum.get()).toBe(5);
	});

	it('recomputes lazily when a dependency changes', () => {
		const a = state(2);
		const sum = computed(() => a.get() * 10);
		expect(sum.get()).toBe(20);
		a.set(3);
		expect(sum.get()).toBe(30);
	});

	it('does not recompute (cached) when read repeatedly with no dependency change', () => {
		const a = state(2);
		const spy = vi.fn(() => a.get() * 2);
		const doubled = computed(spy);
		doubled.get();
		doubled.get();
		doubled.get();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	describe('circular dependencies', () => {
		it('throws a clear error when a computed reads itself', () => {
			const self: Computed<number> = computed(() => self.get() + 1);
			expect(() => self.get()).toThrow(/cycle/i);
		});

		it('throws when two computeds read each other', () => {
			const a: Computed<number> = computed(() => b.get() + 1);
			const b: Computed<number> = computed(() => a.get() + 1);
			expect(() => a.get()).toThrow(/cycle/i);
		});

		it('is not stuck after a throw: the computed recovers once the cycle is gone', () => {
			const breakCycle = state(false);
			const self: Computed<number> = computed(() => (breakCycle.get() ? 42 : self.get()));
			expect(() => self.get()).toThrow(/cycle/i);
			breakCycle.set(true);
			expect(self.get()).toBe(42);
		});

		it('does not treat a shared (diamond) dependency as a cycle', () => {
			const a = state(1);
			const b = computed(() => a.get() + 1);
			const c = computed(() => a.get() + 2);
			const d = computed(() => b.get() + c.get());
			expect(d.get()).toBe(5);
		});
	});

	describe('subscribes to its sources only while observed', () => {
		it('stays correct for reads made while nothing observes it', () => {
			const a = state(1);
			const doubled = computed(() => a.get() * 2);
			expect(doubled.get()).toBe(2);
			a.set(2);
			a.set(3);
			expect(doubled.get()).toBe(6);
		});

		it('re-verifies on re-observation: a change made while idle is not missed', async () => {
			const a = state(1);
			const doubled = computed(() => a.get() * 2);
			const seen: number[] = [];

			const dispose = effect(() => { seen.push(doubled.get()); });
			dispose(); // computed goes idle: unsubscribed from `a`
			a.set(5); // nobody is told

			const dispose2 = effect(() => { seen.push(doubled.get()); });
			a.set(6);
			await flushEffects();
			dispose2();
			expect(seen).toEqual([2, 10, 12]);
		});

		it('chained computeds go idle and wake up together', async () => {
			const a = state(1);
			const doubled = computed(() => a.get() * 2);
			const quadrupled = computed(() => doubled.get() * 2);
			const seen: number[] = [];

			effect(() => { seen.push(quadrupled.get()); })();
			a.set(2);
			effect(() => { seen.push(quadrupled.get()); });
			a.set(3);
			await flushEffects();
			expect(seen).toEqual([4, 8, 12]);
		});
	});

	it('propagates through chained computeds', () => {
		const a = state(1);
		const doubled = computed(() => a.get() * 2);
		const quadrupled = computed(() => doubled.get() * 2);
		expect(quadrupled.get()).toBe(4);
		a.set(2);
		expect(quadrupled.get()).toBe(8);
	});

	it('peek() reads without tracking (no dependency registered)', async () => {
		const a = state(1);
		const doubled = computed(() => a.get() * 2);
		doubled.get(); // warm cache
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
		const doubled = computed(() => a.get() * 2);
		expect(doubled.get()).toBe(2);
		a.set(3);
		expect(doubled.peek()).toBe(6);
	});

	it('options.equals keeps the previous cached reference when the recomputed value is equivalent', () => {
		const a = state(1);
		const point = computed(
			() => ({ parity: a.get() % 2 === 0 ? 'even' : 'odd' }),
			{ equals: (x, y) => x.parity === y.parity }
		);
		const first = point.get();
		a.set(3); // still odd - recomputes, but equals() says it's the same as before
		expect(point.get()).toBe(first); // same object reference, not a freshly recomputed one
		a.set(4); // now even - genuinely different
		expect(point.get()).not.toBe(first);
		expect(point.get()).toEqual({ parity: 'even' });
	});
});
