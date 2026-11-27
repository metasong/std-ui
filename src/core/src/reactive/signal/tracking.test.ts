import { describe, expect, it, vi } from 'vitest';
import { computed } from './computed.js';
import { effect } from '../effect/effect.js';
import { inReactiveContext, untrack, Watcher } from './tracking.js';
import { state } from './state.js';

describe('untrack', () => {
	it('reads a signal without tracking it, even inside a tracked run', () => {
		const a = state(1);
		const spy = vi.fn(() => untrack(() => a.get()) + 1);
		const c = computed(spy);
		expect(c.get()).toBe(2);

		a.set(2); // `a` was not tracked - the computed stays cached
		expect(c.get()).toBe(2);
		expect(spy).toHaveBeenCalledTimes(1);
	});
});

describe('inReactiveContext', () => {
	it('is true only while a computed body runs', () => {
		let inside = false;
		computed(() => (inside = inReactiveContext())).get();
		expect(inside).toBe(true);
		expect(inReactiveContext()).toBe(false);
	});
});

describe('Watcher', () => {
	it('rejects anything that is not a state()/computed() accessor', () => {
		expect(() => new Watcher(() => {}).watch((() => 1) as never)).toThrow();
	});

	it('fires notify once when a watched dependency changes, then goes inert until re-armed', () => {
		const a = state(1);
		const notify = vi.fn();
		const watcher = new Watcher(notify);
		const double = computed(() => a.get() * 2);
		double.get();
		watcher.watch(double);
		expect(notify).not.toHaveBeenCalled();

		a.set(2);
		expect(notify).toHaveBeenCalledTimes(1);

		a.set(3);
		expect(notify).toHaveBeenCalledTimes(1);

		double.get(); // re-read so it can go dirty again
		watcher.watch(); // re-arm
		a.set(4);
		expect(notify).toHaveBeenCalledTimes(2);
	});

	it('getPending() reports a watched computed that was notified', () => {
		const a = state(1);
		const double = computed(() => a.get() * 2);
		double.get();
		const watcher = new Watcher(() => {});
		watcher.watch(double);
		expect(watcher.getPending()).toEqual([]);

		a.set(2);
		expect(watcher.getPending()).toEqual([double]);
	});

	it('unwatch() stops a signal from notifying this watcher', () => {
		const a = state(1);
		const notify = vi.fn();
		const watcher = new Watcher(notify);
		watcher.watch(a);
		watcher.unwatch(a);
		a.set(2);
		expect(notify).not.toHaveBeenCalled();
	});
});

describe('equality cutoff (push-pull)', () => {
	const flush = () => new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

	it('effect skips re-run when a computed recomputes to an equal value', async () => {
		const a = state(1);
		const parity = computed(() => a.get() % 2);
		let runs = 0;
		effect(() => {
			parity.get();
			runs++;
		});
		a.set(3);
		await flush();
		expect(runs).toBe(1);
		a.set(4);
		await flush();
		expect(runs).toBe(2);
	});

	it('computed skips recompute when its computed source is unchanged', () => {
		const a = state(1);
		const parity = computed(() => a.get() % 2);
		const fn = vi.fn(() => parity.get() * 10);
		const derived = computed(fn);
		derived.get();
		a.set(3);
		expect(derived.get()).toBe(10);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('effect still re-runs after a false alarm when later changes happen', async () => {
		const a = state(1);
		const parity = computed(() => a.get() % 2);
		let runs = 0;
		effect(() => {
			parity.get();
			runs++;
		});
		a.set(3);
		await flush();
		a.set(2);
		await flush();
		expect(runs).toBe(2);
	});
});
