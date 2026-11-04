import { describe, expect, it, vi } from 'vitest';
import { computed, effect, signal } from './signal.js';

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
		await flush();
		spy.mockClear();

		count.set(2);
		await flush();
		expect(spy).not.toHaveBeenCalled();
	});

	it('set() is a no-op for an Object.is-equal value (no notification)', async () => {
		const count = signal(1);
		const spy = vi.fn();
		effect(() => {
			count();
			spy();
		});
		await flush();
		spy.mockClear();

		count.set(1);
		await flush();
		expect(spy).not.toHaveBeenCalled();
	});
});

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
		await flush();
		spy.mockClear();

		a.set(2);
		await flush();
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

describe('effect', () => {
	it('runs synchronously once on creation', () => {
		const spy = vi.fn();
		effect(spy);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('re-runs (batched into a microtask) when a read signal changes', async () => {
		const count = signal(0);
		const spy = vi.fn();
		effect(() => {
			spy(count());
		});
		expect(spy).toHaveBeenCalledTimes(1);

		count.set(1);
		count.set(2);
		await flush();
		// Multiple synchronous writes before the microtask flush collapse into one re-run.
		expect(spy).toHaveBeenCalledTimes(2);
		expect(spy).toHaveBeenLastCalledWith(2);
	});

	it('runs the cleanup registered via onCleanup before the next re-run and on dispose', async () => {
		const count = signal(0);
		const cleanup = vi.fn();
		const dispose = effect(onCleanup => {
			count();
			onCleanup(cleanup);
		});
		expect(cleanup).not.toHaveBeenCalled();

		count.set(1);
		await flush();
		expect(cleanup).toHaveBeenCalledTimes(1);

		dispose();
		expect(cleanup).toHaveBeenCalledTimes(2);
	});

	it('dispose() stops future re-runs', async () => {
		const count = signal(0);
		const spy = vi.fn();
		const dispose = effect(() => spy(count()));
		dispose();

		count.set(1);
		await flush();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('only tracks dependencies actually read on the latest run (dynamic dependencies)', async () => {
		const useA = signal(true);
		const a = signal('a');
		const b = signal('b');
		const spy = vi.fn();
		effect(() => {
			spy(useA() ? a() : b());
		});
		expect(spy).toHaveBeenCalledTimes(1);

		useA.set(false);
		await flush();
		expect(spy).toHaveBeenCalledTimes(2); // re-ran because `useA` changed, now reads `b` instead
		spy.mockClear();

		a.set('a2'); // no longer read - shouldn't trigger a re-run
		await flush();
		expect(spy).not.toHaveBeenCalled();

		b.set('b2');
		await flush();
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
