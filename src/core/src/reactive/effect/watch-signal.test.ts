import { describe, expect, it, vi } from 'vitest';
import { Signal } from 'signal-polyfill';
import { computed, state } from '../index.js';
import { effect } from './effect.js';
import { whenFlushed } from './scheduler.js';
import { markSignal } from '../signal/index.js';
import { watchSignal } from './watch-signal.js';

declare const process: {
	on(event: 'uncaughtException', listener: (error: Error) => void): void;
	off(event: 'uncaughtException', listener: (error: Error) => void): void;
};

const followers = (sig: object) => Signal.subtle.introspectSinks(sig as Signal.State<unknown>).length;

describe('watchSignal()', () => {
	it('calls back now, then once per flush after changes', async () => {
		const s = state(1);
		const seen: number[] = [];
		const stop = watchSignal(s, (v) => seen.push(v));
		expect(seen).toEqual([1]);
		s.set(2);
		s.set(3);
		await whenFlushed();
		expect(seen).toEqual([1, 3]);
		stop();
	});

	it('skips a computed that settles on the same value', async () => {
		const s = state(1);
		const parity = computed(() => s.get() % 2);
		const seen: number[] = [];
		const stop = watchSignal(parity, (v) => seen.push(v));
		s.set(3); // same parity
		await whenFlushed();
		expect(seen).toEqual([1]);
		s.set(4);
		await whenFlushed();
		expect(seen).toEqual([1, 0]);
		stop();
	});

	it('uses a computed\'s own equals as the cutoff', async () => {
		const s = state(1);
		// Equal when the first digit matches, even though Object.is says different.
		const byTens = computed(() => s.get(), { equals: (a, b) => Math.floor(a / 10) === Math.floor(b / 10) });
		const seen: number[] = [];
		const stop = watchSignal(byTens, (v) => seen.push(v));
		s.set(5); // same bucket: the computed keeps its old value, no callback
		await whenFlushed();
		s.set(25); // new bucket
		await whenFlushed();
		expect(seen).toEqual([1, 25]);
		stop();
	});

	it('calls back for a computed whose equals says "different" for the same reference', async () => {
		const list = state<number[]>([1], { equals: () => false });
		const view = computed(() => list.get(), { equals: () => false }); // always different, even for the same array
		const seen: number[] = [];
		const stop = watchSignal(view, (v) => seen.push(v.length));
		list.peek().push(2);
		list.set(list.peek());
		await whenFlushed();
		expect(seen).toEqual([1, 2]);
		stop();
	});

	it('trusts a state\'s own equals: an in-place mutation re-set with equals: () => false still calls back', async () => {
		const list = state<number[]>([1], { equals: () => false });
		const seen: number[] = [];
		const stop = watchSignal(list, (v) => seen.push(v.length));
		list.peek().push(2);
		list.set(list.peek()); // same reference, but the state says it changed
		await whenFlushed();
		expect(seen).toEqual([1, 2]);
		stop();
	});

	it('does not call back for a state set to an equal value', async () => {
		const s = state(1);
		const fn = vi.fn();
		const stop = watchSignal(s, fn);
		s.set(1);
		await whenFlushed();
		expect(fn).toHaveBeenCalledTimes(1);
		stop();
	});

	it('stops after dispose() and leaves no follower', async () => {
		const s = state(1);
		const fn = vi.fn();
		const stop = watchSignal(s, fn);
		expect(followers(s)).toBe(1);
		stop();
		stop(); // idempotent
		expect(followers(s)).toBe(0);
		s.set(2);
		await whenFlushed();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('does not make the enclosing effect depend on the signal, nor does the callback track', async () => {
		const s = state(1);
		const other = state(10);
		const outer = vi.fn();
		const stopOuter = effect(() => {
			outer();
			watchSignal(s, () => { other.get(); });
		});
		s.set(2);
		other.set(11);
		await whenFlushed();
		expect(outer).toHaveBeenCalledTimes(1);
		stopOuter();
	});

	it('runs in the same flush as effects, so whenFlushed() covers it', async () => {
		const s = state(1);
		const order: string[] = [];
		const stopEffect = effect(() => { order.push(`effect ${s.get()}`); });
		const stopWatch = watchSignal(s, (v) => order.push(`watch ${v}`));
		order.length = 0;
		s.set(2);
		await whenFlushed();
		expect(order.sort()).toEqual(['effect 2', 'watch 2']);
		stopEffect();
		stopWatch();
	});

	it('a watch and an effect writing each other are stopped by the cycle guard, which names the watch and its source', async () => {
		const a = state(0);
		const b = state(0);
		const stopWatch = watchSignal(a, (v) => { b.set(v + 1); }, 'my-watch');
		const stopEffect = effect(() => { a.set(b.get() + 1); }, null, { name: 'my-effect' });
		const errors: unknown[] = [];
		const onError = (err: unknown) => { errors.push(err); };
		process.on('uncaughtException', onError);
		try {
			await whenFlushed();
			await new Promise((r) => setTimeout(r, 0));
		} finally {
			process.off('uncaughtException', onError);
			stopWatch();
			stopEffect();
		}
		const error = errors.flatMap((e) => (e instanceof AggregateError ? e.errors : [e])).find((e) => /re-ran more than/.test(String((e as Error).message)));
		expect(error).toBeDefined();
		const message = (error as Error).message;
		expect(message).toMatch(/re-ran more than 100 times/);
		expect(message).toContain('effect "my-watch"');
		expect(message).toMatch(/reads: state\(\d+\)/);
	});
	it('watches a standard Signal.State directly', async () => {
		const s = new Signal.State(1);
		const seen: number[] = [];
		const stop = watchSignal(s, (v) => seen.push(v));
		s.set(2);
		await whenFlushed();
		expect(seen).toEqual([1, 2]);
		stop();
	});
	it('watches a marked wrapper (not a State / Computed) through a computed', async () => {
		const inner = state(1);
		const wrapper = markSignal({ get: () => inner.get() });
		const seen: number[] = [];
		const stop = watchSignal(wrapper, (v) => seen.push(v));
		inner.set(2);
		await whenFlushed();
		expect(seen).toEqual([1, 2]);
		stop();
		inner.set(3);
		await whenFlushed();
		expect(seen).toEqual([1, 2]);
	});
});
