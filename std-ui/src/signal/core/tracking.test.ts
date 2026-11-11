import { describe, expect, it, vi } from 'vitest';
import { computed } from './computed.js';
import { effect } from '../effect/main.js';
import { flushEffects } from '../effect/test-helpers.js';
import { signal } from './signal.js';
import { ReactiveNode, runTracked, untrack, Watcher } from './tracking.js';

describe('untrack', () => {
	it('reads a signal without tracking it, even inside a tracked run', () => {
		const a = signal(1);
		const spy = vi.fn(() => untrack(() => a()));
		const consumer = new ReactiveNode();
		consumer.markDirty = vi.fn();
		expect(runTracked(consumer, spy)).toBe(1);

		a.set(2); // no one should be subscribed - `markDirty` must not have been called
		expect(consumer.markDirty).not.toHaveBeenCalled();
	});
});

describe('Watcher', () => {
	it('fires notify once when a watched dependency changes, then goes inert', () => {
		const a = signal(1);
		const notify = vi.fn();
		const watcher = new Watcher(notify);
		// `signal`/`computed` don't expose their internal `Dependency` directly, so watch through
		// a computed that tracks `a` and exposes its own dependency via a tracked read.
		const double = computed(() => a() * 2);
		double(); // warm it so reading it inside runTracked below tracks `double`'s own dep

		runTracked(watcher, () => double());
		expect(notify).not.toHaveBeenCalled();

		a.set(2);
		expect(notify).toHaveBeenCalledTimes(1);

		// Inert after firing: further changes don't notify again until re-`watch()`ed.
		a.set(3);
		expect(notify).toHaveBeenCalledTimes(1);
	});

	it('getPending() reports a watched dependency marked dirty, without forcing a recompute', () => {
		const dep = new ReactiveNode();
		const watcher = new Watcher(() => {});
		watcher.watch(dep);
		expect(watcher.getPending()).toEqual([]);

		dep.dirty = true;
		expect(watcher.getPending()).toEqual([dep]);
	});

	it('unwatch() stops a dependency from notifying this watcher', () => {
		const dep = new ReactiveNode();
		const notify = vi.fn();
		const watcher = new Watcher(notify);
		watcher.watch(dep);
		watcher.unwatch(dep);

		const a = signal(1);
		runTracked(watcher, () => a()); // re-arms watcher with `a`'s real dependency only
		a.set(2);
		expect(notify).toHaveBeenCalledTimes(1); // only from `a`, `dep` was already unwatched
	});
});

describe('equality cutoff (push-pull)', () => {
	const flush = () => new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

	it('effect skips re-run when a computed recomputes to an equal value', async () => {
		const a = signal(1);
		const parity = computed(() => a() % 2);
		let runs = 0;
		effect(() => {
			parity();
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
		const a = signal(1);
		const parity = computed(() => a() % 2);
		const fn = vi.fn(() => parity() * 10);
		const derived = computed(fn);
		derived();
		a.set(3);
		expect(derived()).toBe(10);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('effect still re-runs after a false alarm when later changes happen', async () => {
		const a = signal(1);
		const parity = computed(() => a() % 2);
		let runs = 0;
		effect(() => {
			parity();
			runs++;
		});
		a.set(3);
		await flush();
		a.set(2);
		await flush();
		expect(runs).toBe(2);
	});
});
