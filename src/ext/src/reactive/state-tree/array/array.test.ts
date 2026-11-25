import { describe, expect, it } from 'vitest';
import { state } from '@std-ui/core';
import { effect } from '@std-ui/core';
import { stateTree } from '../main.js';
import { stateArray } from './main.js';

describe('stateArray', () => {
	it('reads initial values and peek snapshots without tracking', () => {
		const list = stateArray([1, 2], state);
		expect(list.deep()).toEqual([1, 2]);
		expect(list.peek()).toEqual([1, 2]);
	});

	it('mutates with push, pop, splice, and clear', () => {
		const list = stateArray([1, 2], state);
		list.push(3);
		expect(list.deep()).toEqual([1, 2, 3]);
		expect(list.pop()).toBe(3);
		expect(list.deep()).toEqual([1, 2]);
		list.splice(0, 1, 9);
		expect(list.deep()).toEqual([9, 2]);
		list.clear();
		expect(list.deep()).toEqual([]);
	});

	it('set() reuses item nodes by index', () => {
		const list = stateArray([10, 20], state);
		const n0 = list.at(0);
		const n1 = list.at(1);
		list.set([99, 20]);
		expect(list.at(0)).toBe(n0);
		expect(list.at(1)).toBe(n1);
		expect(list.deep()).toEqual([99, 20]);
	});

	it('length computed tracks structure only', async () => {
		const list = stateArray([1, 2], state);
		let lenRuns = 0;
		effect(() => {
			list.length.get();
			lenRuns++;
		});
		await flush();
		expect(lenRuns).toBe(1);

		list.at(0)!.set(5);
		await flush();
		expect(lenRuns).toBe(1);

		list.push(3);
		await flush();
		expect(lenRuns).toBe(2);
		expect(list.length.get()).toBe(3);
	});

	it('at(i) effect does not re-run when a sibling item changes', async () => {
		const list = stateArray([1, 2], state);
		let slot0Runs = 0;
		effect(() => {
			list.at(0)!.get();
			slot0Runs++;
		});
		await flush();
		expect(slot0Runs).toBe(1);

		list.at(1)!.set(99);
		await flush();
		expect(slot0Runs).toBe(1);

		list.at(0)!.set(11);
		await flush();
		expect(slot0Runs).toBe(2);
	});

	it('whole-list effect re-runs on structure and any item change', async () => {
		const list = stateArray([1, 2], state);
		let allRuns = 0;
		effect(() => {
			list.deep();
			allRuns++;
		});
		await flush();
		expect(allRuns).toBe(1);

		list.at(1)!.set(2);
		await flush();
		expect(allRuns).toBe(1);

		list.at(1)!.set(99);
		await flush();
		expect(allRuns).toBe(2);

		list.push(3);
		await flush();
		expect(allRuns).toBe(3);
	});

	it('() returns plain values and tracks only set() replacement', async () => {
		const list = stateArray([1, 2], state);
		expect(list.get()).toEqual([1, 2]);
		expect(list.shallow()).toBe(list.deep());
		let runs = 0;
		effect(() => {
			list.get();
			runs++;
		});
		await flush();
		list.at(0)!.set(5);
		await flush();
		expect(runs).toBe(1);
		list.push(3);
		await flush();
		expect(runs).toBe(1);
		list.set([7, 8]);
		await flush();
		expect(runs).toBe(2);
	});

	it('[i] returns the node without tracking', async () => {
		const list = stateArray([1, 2], state);
		expect(list[1]).toBe(list.at(1));
		expect(list[5]).toBeUndefined();
		let runs = 0;
		effect(() => {
			list[0];
			runs++;
		});
		await flush();
		list.unshift(0);
		await flush();
		expect(runs).toBe(1);
	});

	it('negative at() indexes from the end', () => {
		const list = stateArray([1, 2, 3], state);
		expect(list.at(-1)!.get()).toBe(3);
		expect(list.at(-2)!.get()).toBe(2);
	});

	it('remove returns false for out-of-range index', () => {
		const list = stateArray([1], state);
		expect(list.remove(5)).toBe(false);
		expect(list.deep()).toEqual([1]);
		list.remove(0);
		expect(list.deep()).toEqual([]);
	});
});

describe('stateArray via state', () => {
	it('exposes tags as an observable collection', () => {
		const tree = stateTree({ tags: ['a', 'b'] as string[] });
		expect(tree.tags.deep()).toEqual(['a', 'b']);
		expect(typeof tree.tags.push).toBe('function');
		tree.tags.push('c');
		expect(tree.tags.deep()).toEqual(['a', 'b', 'c']);
	});

	it('updates a tag in place via at()', () => {
		const tree = stateTree({ tags: ['a', 'b'] });
		tree.tags.at(0)!.set('z');
		expect(tree.deep()).toEqual({ tags: ['z', 'b'] });
	});

	it('accepts whole-array replace from root .set({ tags })', () => {
		const tree = stateTree({ count: 0, tags: ['a'] });
		tree.set({ tags: ['x', 'y'] });
		expect(tree.tags.deep()).toEqual(['x', 'y']);
		expect(tree.count.get()).toBe(0);
	});

	it('object elements are state branches', () => {
		const todos = stateTree([{ text: 'a', done: false }]);
		expect(todos.at(0)!.text.get()).toBe('a');
		todos.at(0)!.done.set(true);
		expect(todos.at(0)!.deep()).toEqual({ text: 'a', done: true });
	});
});

function flush(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(() => queueMicrotask(resolve)));
}
