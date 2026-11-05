import { describe, expect, it, vi } from 'vitest';
import { computed } from './computed.js';
import { signal } from './signal.js';
import { runTracked, untrack, Watcher } from './tracking.js';

describe('untrack', () => {
	it('reads a signal without tracking it, even inside a tracked run', () => {
		const a = signal(1);
		const spy = vi.fn(() => untrack(() => a()));
		const consumer = { deps: new Set<never>(), run: vi.fn() } as never;
		expect(runTracked(consumer as never, spy)).toBe(1);

		a.set(2); // no one should be subscribed - `run` must not have been called
		expect((consumer as { run: () => void }).run).not.toHaveBeenCalled();
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
		let dirty = false;
		const dep = { subscribers: new Set<never>(), isDirty: () => dirty } as never;
		const watcher = new Watcher(() => {});
		watcher.watch(dep);
		expect(watcher.getPending()).toEqual([]);

		dirty = true;
		expect(watcher.getPending()).toEqual([dep]);
	});

	it('unwatch() stops a dependency from notifying this watcher', () => {
		const dep = { subscribers: new Set<never>() } as never;
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
