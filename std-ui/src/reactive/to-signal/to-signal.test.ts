import { describe, expect, it } from 'vitest';
import { untrack } from '../signal/tracking.js';
import { effect } from '../effect/main.js';
import { flushEffects } from '../effect/test-helpers.js';
import { toSignal } from './to-signal.js';
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
	return { source, emit: (v: T) => observer.next?.(v), fail: (e: unknown) => observer.error?.(e), isUnsubscribed: () => unsubscribed };
}

describe('toSignal', () => {
	it('is undefined (or initialValue) until a promise resolves', async () => {
		const s = toSignal(Promise.resolve(5));
		expect(s()).toBeUndefined();
		await flushEffects();
		expect(s()).toBe(5);
		expect(toSignal(new Promise<number>(() => {}), { initialValue: 0 })()).toBe(0);
	});

	it('throws on read when a promise rejects', async () => {
		const s = toSignal(Promise.reject(new Error('boom')));
		await flushEffects();
		expect(() => s()).toThrow('boom');
	});

	it('tracks the latest value of an observable-like source', () => {
		const { source, emit } = makeSource<number>();
		const s = toSignal(source, { initialValue: 0 });
		emit(1);
		emit(2);
		expect(s()).toBe(2);
	});

	it('keeps a synchronously emitted value', () => {
		const source: Subscribable<number> = {
			subscribe(o) { o.next?.(7); return { unsubscribe() {} }; },
		};
		expect(toSignal(source)()).toBe(7);
	});

	it('throws on read after the observable errors', () => {
		const { source, fail } = makeSource<number>();
		const s = toSignal(source);
		fail(new Error('bad'));
		expect(() => s()).toThrow('bad');
	});

	it('dispose() unsubscribes, ignores later values, and keeps the last one', () => {
		const { source, emit, isUnsubscribed } = makeSource<number>();
		const s = toSignal(source, { initialValue: 0 });
		emit(1);
		s.dispose();
		emit(2);
		expect(isUnsubscribed()).toBe(true);
		expect(s()).toBe(1);
	});

	it('dispose() makes a pending promise result ignored', async () => {
		const s = toSignal(Promise.resolve(1), { initialValue: 0 });
		s.dispose();
		await flushEffects();
		expect(s()).toBe(0);
	});

	it('throws when called inside an effect (reactive context)', () => {
		const { source } = makeSource<number>();
		expect(() => {
			effect(() => {
				toSignal(source);
			});
		}).toThrow(/toSignal\(\) must not run/);
	});

	it('notifies effects when the source emits', async () => {
		const { source, emit } = makeSource<number>();
		const s = toSignal(source, { initialValue: 0 });
		const seen: number[] = [];
		const stop = effect(() => { seen.push(s()); });
		await flushEffects();
		emit(1);
		await flushEffects();
		emit(2);
		await flushEffects();
		expect(seen).toEqual([0, 1, 2]);
		stop();
	});

	it('uses a custom equals for emitted values but not the initial value', () => {
		const { source, emit } = makeSource<number>();
		const calls: number[][] = [];
		const s = toSignal(source, {
			initialValue: 0,
			equals: (a, b) => { calls.push([a, b]); return a === b; },
		});
		emit(1);
		emit(1);
		expect(calls).toEqual([[1, 1]]);
		expect(s()).toBe(1);
	});

	it('error releases the subscription', () => {
		const b = makeSource<number>();
		toSignal(b.source);
		b.fail(new Error('x'));
		expect(b.isUnsubscribed()).toBe(true);
	});

	it('completion releases the subscription', () => {
		let observer: PartialObserver<number> = {};
		let unsubscribed = false;
		toSignal<number>({
			subscribe(o) { observer = o; return { unsubscribe: () => { unsubscribed = true; } }; },
		});
		observer.complete?.();
		expect(unsubscribed).toBe(true);
	});

	it('unwraps @@observable interop sources', () => {
		const { source, emit } = makeSource<number>();
		const s = toSignal<number>({ '@@observable': () => source });
		emit(3);
		expect(s()).toBe(3);
	});

	it('throws a TypeError for unsupported sources', () => {
		expect(() => toSignal({} as never)).toThrow(TypeError);
	});

	it('dispose() is idempotent', () => {
		const { source } = makeSource<number>();
		const s = toSignal(source);
		s.dispose();
		expect(() => s.dispose()).not.toThrow();
	});

	it('works when created under untrack inside an effect', () => {
		const { source } = makeSource<number>();
		expect(() => {
			effect(() => { untrack(() => { toSignal(source); }); });
		}).not.toThrow();
	});

	it('onCleanup registers dispose', () => {
		const { source, isUnsubscribed } = makeSource<number>();
		let registered: (() => void) | undefined;
		toSignal(source, { onCleanup: fn => (registered = fn) });
		registered?.();
		expect(isUnsubscribed()).toBe(true);
	});
});
