import { describe, expect, it, vi } from 'vitest';
import { effect } from './effect.js';
import { signal } from './signal.js';
import { flushEffects } from './test-helpers.js';

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
		await flushEffects();
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
		await flushEffects();
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
		await flushEffects();
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
		await flushEffects();
		expect(spy).toHaveBeenCalledTimes(2); // re-ran because `useA` changed, now reads `b` instead
		spy.mockClear();

		a.set('a2'); // no longer read - shouldn't trigger a re-run
		await flushEffects();
		expect(spy).not.toHaveBeenCalled();

		b.set('b2');
		await flushEffects();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('runs afterAction after monitoredAction, re-running it when monitoredAction re-runs, but not tracking signals it reads', async () => {
		const count = signal(0);
		const other = signal(0);
		const order: string[] = [];
		const monitoredSpy = vi.fn(() => order.push('monitored'));
		const afterSpy = vi.fn(() => {
			order.push('after');
			other(); // read inside afterAction - should not be tracked
		});
		effect(() => {
			count();
			monitoredSpy();
		}, afterSpy);
		expect(monitoredSpy).toHaveBeenCalledTimes(1);
		expect(afterSpy).toHaveBeenCalledTimes(1);
		expect(order).toEqual(['monitored', 'after']);

		// Signal read inside monitoredAction triggers a re-run of both monitoredAction and afterAction.
		count.set(1);
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(2);
		expect(afterSpy).toHaveBeenCalledTimes(2);
		expect(order).toEqual(['monitored', 'after', 'monitored', 'after']);

		// Signal read only inside afterAction isn't tracked, so changing it shouldn't trigger a re-run.
		other.set(1);
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(2);
		expect(afterSpy).toHaveBeenCalledTimes(2);
	});
});
