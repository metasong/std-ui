import { Signal } from 'signal-polyfill';
import { describe, expect, it } from 'vitest';
import { whenFlushed } from '../../../../core/src/reactive/effect/scheduler.js';
import { watchSignal } from '../../../../core/src/reactive/effect/watch-signal.js';
import { store } from './main.js';

describe('watching a container node', () => {
	it('a node proxy does not pass instanceof Signal.Computed (the polyfill would reject it)', () => {
		expect(store({ a: 1 }) instanceof Signal.Computed).toBe(false);
		expect(store([1]) instanceof Signal.Computed).toBe(false);
	});

	it('an object node is watched directly, with no wrapper computed', async () => {
		const obj = store({ a: 1 } as Record<string, number>);
		const seen: unknown[] = [];
		const stop = watchSignal(obj, (v) => seen.push(v));
		expect(seen).toEqual([{ a: 1 }]);
		obj.set({ a: 1, b: 2 }); // adds a key
		await whenFlushed();
		expect(seen).toEqual([{ a: 1 }, { a: 1, b: 2 }]);
		stop();
		obj.set({ a: 1, b: 2, c: 3 });
		await whenFlushed();
		expect(seen).toHaveLength(2);
	});

	it('an object node re-fires when a member is deleted', async () => {
		const obj = store({ a: 1, b: 2 } as Record<string, number>);
		const seen: unknown[] = [];
		const stop = watchSignal(obj, (v) => seen.push(v));
		(obj as unknown as { delete(key: string): boolean }).delete('b');
		await whenFlushed();
		expect(seen).toEqual([{ a: 1, b: 2 }, { a: 1 }]);
		stop();
	});

	it('an array node is watched directly and fires on push', async () => {
		const list = store([1, 2]);
		const seen: unknown[] = [];
		const stop = watchSignal(list, (v) => seen.push(v));
		list.push(3);
		await whenFlushed();
		expect(seen).toEqual([[1, 2], [1, 2, 3]]);
		stop();
	});
});
