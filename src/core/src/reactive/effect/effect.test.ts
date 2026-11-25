import { describe, expect, it, vi } from 'vitest';
import { computed } from '../signal/computed.js';
import { state } from '../signal/state.js';
import { effect, whenFlushed } from './main.js';
import { flushEffects } from './test-helpers.js';

// Node's `process` (tests run under vitest/Node); declared locally so no `@types/node` is needed.
declare const process: {
	on(event: 'uncaughtException', listener: (error: Error) => void): void;
	once(event: 'uncaughtException', listener: (error: Error) => void): void;
	off(event: 'uncaughtException', listener: (error: Error) => void): void;
};

describe('effect', () => {
	it('runs synchronously once on creation', () => {
		const spy = vi.fn();
		effect(spy);
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('re-runs (batched into a microtask) when a read signal changes', async () => {
		const count = state(0);
		const spy = vi.fn();
		effect(() => {
			spy(count.get());
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
		const count = state(0);
		const cleanup = vi.fn();
		const dispose = effect(onCleanup => {
			count.get();
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
		const count = state(0);
		const spy = vi.fn();
		const dispose = effect(() => spy(count.get()));
		dispose();

		count.set(1);
		await flushEffects();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('only tracks dependencies actually read on the latest run (dynamic dependencies)', async () => {
		const useA = state(true);
		const a = state('a');
		const b = state('b');
		const spy = vi.fn();
		effect(() => {
			spy(useA.get() ? a.get() : b.get());
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
		const count = state(0);
		const other = state(0);
		const order: string[] = [];
		const monitoredSpy = vi.fn(() => order.push('monitored'));
		const afterSpy = vi.fn(() => {
			order.push('after');
			other.get(); // read inside afterAction - should not be tracked
		});
		effect(() => {
			count.get();
			monitoredSpy();
		}, afterSpy);
		expect(monitoredSpy).toHaveBeenCalledTimes(1);
		expect(afterSpy).toHaveBeenCalledTimes(1);
		expect(order).toEqual(['monitored', 'after']);

		// State read inside monitoredAction triggers a re-run of both monitoredAction and afterAction.
		count.set(1);
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(2);
		expect(afterSpy).toHaveBeenCalledTimes(2);
		expect(order).toEqual(['monitored', 'after', 'monitored', 'after']);

		// State read only inside afterAction isn't tracked, so changing it shouldn't trigger a re-run.
		other.set(1);
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(2);
		expect(afterSpy).toHaveBeenCalledTimes(2);
	});

	it('skips afterAction when the watcher fires but monitoredAction does not re-run (false alarm)', async () => {
		const source = state(1);
		// Same result for 1 and 3, so the equality cutoff keeps the effect's body from re-running.
		const parity = computed(() => source.get() % 2);
		const monitoredSpy = vi.fn(() => { parity.get(); });
		const afterSpy = vi.fn();
		effect(monitoredSpy, afterSpy);
		expect(monitoredSpy).toHaveBeenCalledTimes(1);
		expect(afterSpy).toHaveBeenCalledTimes(1);

		source.set(3); // watcher is notified, but parity is unchanged
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(1);
		expect(afterSpy).toHaveBeenCalledTimes(1);

		// A real change still runs both, and afterAction stays paired with monitoredAction afterwards.
		source.set(4);
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(2);
		expect(afterSpy).toHaveBeenCalledTimes(2);

		source.set(6); // false alarm again
		await flushEffects();
		expect(monitoredSpy).toHaveBeenCalledTimes(2);
		expect(afterSpy).toHaveBeenCalledTimes(2);
	});
});

describe('whenFlushed', () => {
	it('resolves immediately when nothing is pending', async () => {
		await expect(whenFlushed()).resolves.toBeUndefined();
	});

	it('waits for a pending re-run', async () => {
		const a = state(0);
		const seen: number[] = [];
		effect(() => { seen.push(a.get()); });
		a.set(1);
		await whenFlushed();
		expect(seen).toEqual([0, 1]);
	});

	it('waits for a cascade of any depth', async () => {
		const s = Array.from({ length: 8 }, () => state(0));
		for (let i = 0; i < s.length - 1; i++) effect(() => { s[i + 1].set(s[i].get()); });
		s[0].set(5);
		await whenFlushed();
		expect(s[s.length - 1].get()).toBe(5);
	});

	it('still resolves when an effect throws during the flush', async () => {
		const a = state(0);
		effect(() => { if (a.get() === 1) throw new Error('boom'); });
		const onError = vi.fn();
		process.once('uncaughtException', onError);
		a.set(1);
		await whenFlushed();
		await new Promise(r => setTimeout(r, 0));
		process.off('uncaughtException', onError);
	});
});

describe('effect errors during a flush', () => {
	/** Runs `body` while swallowing the uncaught errors a throwing flush microtask raises. */
	async function collectingUncaught(body: () => Promise<void>): Promise<unknown[]> {
		const errors: unknown[] = [];
		const onError = (err: unknown) => { errors.push(err); };
		process.on('uncaughtException', onError);
		try {
			await body();
			await new Promise(r => setTimeout(r, 0));
		} finally {
			process.off('uncaughtException', onError);
		}
		return errors;
	}

	it('a throwing effect does not stop the other effects scheduled in the same flush', async () => {
		const a = state(0);
		const second = vi.fn();
		effect(() => { if (a.get() === 1) throw new Error('boom'); });
		effect(() => { second(a.get()); });

		const errors = await collectingUncaught(async () => {
			a.set(1);
			await whenFlushed();
			a.set(2);
			await whenFlushed();
		});

		expect(second.mock.calls.map(c => c[0])).toEqual([0, 1, 2]);
		expect(errors.map(e => (e as Error).message)).toEqual(['boom']);
	});

	it('the throwing effect itself keeps reacting to what it read before throwing', async () => {
		const a = state(0);
		const seen: number[] = [];
		effect(() => { const v = a.get(); seen.push(v); if (v === 1) throw new Error('boom'); });

		await collectingUncaught(async () => {
			a.set(1);
			await whenFlushed();
			a.set(2);
			await whenFlushed();
		});

		expect(seen).toEqual([0, 1, 2]);
	});

	it('reports several failures of one flush together', async () => {
		const a = state(0);
		effect(() => { if (a.get() === 1) throw new Error('first'); });
		effect(() => { if (a.get() === 1) throw new Error('second'); });

		const errors = await collectingUncaught(async () => {
			a.set(1);
			await whenFlushed();
		});

		expect(errors).toHaveLength(1);
		expect(errors[0]).toBeInstanceOf(AggregateError);
		expect((errors[0] as AggregateError).errors.map(e => (e as Error).message)).toEqual(['first', 'second']);
	});
});
