import { describe, expect, it } from 'vitest';
import { effect } from '../effect/main.js';
import { signal } from '../core/signal.js';
import { flushEffects } from '../effect/test-helpers.js';
import { toSignalFrom } from './to-signal-from.js';
import type { PartialObserver, Subscribable } from './types.js';

function makeSource<T>() {
	let observer: PartialObserver<T> = {};
	let unsubscribed = false;
	const source: Subscribable<T> = {
		subscribe(o) {
			observer = o;
			return { unsubscribe: () => { unsubscribed = true; } };
		},
	};
	return { source, emit: (v: T) => observer.next?.(v), isUnsubscribed: () => unsubscribed };
}

describe('toSignalFrom', () => {
	it('subscribes to the factory result and tracks values', () => {
		const a = makeSource<number>();
		const s = toSignalFrom(() => a.source, { initialValue: 0 });
		a.emit(4);
		expect(s()).toBe(4);
	});

	it('re-subscribes when signals read in the factory change, keeping the last value', async () => {
		const id = signal(1);
		const sources = new Map<number, ReturnType<typeof makeSource<string>>>();
		const s = toSignalFrom(() => {
			const n = id();
			const src = makeSource<string>();
			sources.set(n, src);
			return src.source;
		}, { initialValue: '' });
		sources.get(1)!.emit('one');
		expect(s()).toBe('one');

		id.set(2);
		await flushEffects();
		expect(sources.get(1)!.isUnsubscribed()).toBe(true);
		expect(s()).toBe('one'); // stale until the new source emits
		sources.get(2)!.emit('two');
		expect(s()).toBe('two');
	});

	it('ignores late values from a superseded source', async () => {
		const id = signal(1);
		const made: ReturnType<typeof makeSource<number>>[] = [];
		const s = toSignalFrom(() => {
			id();
			const src = makeSource<number>();
			made.push(src);
			return src.source;
		});
		id.set(2);
		await flushEffects();
		made[0].emit(99);
		expect(s()).toBeUndefined();
	});

	it('supports null (no source) and promises', async () => {
		const id = signal<number | null>(null);
		const s = toSignalFrom(() => (id() === null ? null : Promise.resolve(id()! * 2)), { initialValue: -1 });
		expect(s()).toBe(-1);
		id.set(5);
		await flushEffects();
		await flushEffects();
		expect(s()).toBe(10);
	});

	it('a factory error is thrown on read and cleared on re-run', async () => {
		const id = signal(0);
		const s = toSignalFrom(() => {
			if (id() === 0) throw new Error('nope');
			return Promise.resolve(id());
		}, { initialValue: 0 });
		expect(() => s()).toThrow('nope');
		id.set(3);
		await flushEffects();
		await flushEffects();
		expect(s()).toBe(3);
	});

	it('notifies effects and dispose() stops everything', async () => {
		const id = signal(1);
		const made: ReturnType<typeof makeSource<number>>[] = [];
		const s = toSignalFrom(() => {
			id();
			const src = makeSource<number>();
			made.push(src);
			return src.source;
		}, { initialValue: 0 });
		const seen: number[] = [];
		const stop = effect(() => { seen.push(s()); });
		made[0].emit(1);
		await flushEffects();
		expect(seen).toEqual([0, 1]);

		s.dispose();
		expect(made[0].isUnsubscribed()).toBe(true);
		id.set(2);
		await flushEffects();
		expect(made).toHaveLength(1);
		stop();
	});

	it('throws inside a reactive context and registers onCleanup', () => {
		expect(() => effect(() => { toSignalFrom(() => null); })).toThrow(/toSignalFrom\(\) must not run/);
		let registered: (() => void) | undefined;
		const a = makeSource<number>();
		toSignalFrom(() => a.source, { onCleanup: fn => (registered = fn) });
		registered?.();
		expect(a.isUnsubscribed()).toBe(true);
	});
});
