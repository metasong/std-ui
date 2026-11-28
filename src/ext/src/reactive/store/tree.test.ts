import { describe, expect, it } from 'vitest';
import { effect } from '@std-ui/core';
import { store } from './main.js';

interface State {
	count: number;
	user: {
		label: string;
		age: number;
	};
	tags: string[];
}

function makeState(): State {
	return { count: 0, user: { label: 'Ada', age: 30 }, tags: ['a', 'b'] };
}

describe('state', () => {
	it('mirrors a plain object: reading the root reassembles every leaf', () => {
		const tree = store(makeState());
		expect(tree.deep()).toEqual(makeState());
	});

	it('exposes each branch/leaf as a same-named property', () => {
		const tree = store(makeState());
		expect(tree.count.get()).toBe(0);
		expect(tree.user.deep()).toEqual({ label: 'Ada', age: 30 });
		expect(tree.user.label.get()).toBe('Ada');
	});

	it('treats arrays as observable collections (StateArray)', () => {
		const tree = store(makeState());
		expect(tree.tags.deep()).toEqual(['a', 'b']);
		expect(typeof tree.tags.push).toBe('function');
		tree.tags.at(0)!.set('z');
		expect(tree.tags.deep()).toEqual(['z', 'b']);
	});

	it('replaces tag contents via .set() on the collection or root .set({ tags })', () => {
		const tree = store(makeState());
		tree.tags.set(['x']);
		expect(tree.tags.deep()).toEqual(['x']);
		expect(tree.deep()).toEqual({ ...makeState(), tags: ['x'] });

		tree.set({ tags: ['y', 'z'] });
		expect(tree.tags.deep()).toEqual(['y', 'z']);
	});

	it('a leaf .set() is reflected when reading its ancestor branches', () => {
		const tree = store(makeState());
		tree.user.label.set('Grace');
		expect(tree.user.label.get()).toBe('Grace');
		expect(tree.user.deep()).toEqual({ label: 'Grace', age: 30 });
		expect(tree.deep()).toEqual({ count: 0, user: { label: 'Grace', age: 30 }, tags: ['a', 'b'] });
	});

	it('peek() snapshots the current value without tracking it as a dependency', async () => {
		const tree = store(makeState());
		expect(tree.peek()).toEqual(makeState());

		let runs = 0;
		effect(() => {
			tree.user.peek();
			runs++;
		});
		await flush();
		const before = runs;

		tree.user.label.set('Grace');
		await flush();
		expect(runs).toBe(before); // no re-run: `peek()` didn't register a dependency
	});

	it('peek() on the root is untracked inside an effect', async () => {
		const tree = store(makeState());
		let runs = 0;
		effect(() => {
			tree.peek();
			runs++;
		});
		await flush();
		const before = runs;

		tree.count.set(9);
		await flush();
		expect(runs).toBe(before);
	});

	it('set() on a branch writes only the provided leaves, leaving others untouched', () => {
		const tree = store(makeState());
		tree.user.set({ label: 'Grace' });
		expect(tree.user.deep()).toEqual({ label: 'Grace', age: 30 });
	});

	it('set() on the root recurses into nested branches', () => {
		const tree = store(makeState());
		tree.set({ count: 5, user: { age: 31 } });
		expect(tree.deep()).toEqual({ count: 5, user: { label: 'Ada', age: 31 }, tags: ['a', 'b'] });
	});

	it('set() forwards explicit undefined to leaf children', () => {
		const tree = store(makeState());
		tree.set({ count: undefined, user: { label: 'Grace' } });
		expect(tree.count.get()).toBeUndefined();
		expect(tree.user.label.get()).toBe('Grace');
	});

	it('setting one branch only notifies effects that read that branch', async () => {
		const tree = store(makeState());
		let userRuns = 0;
		let countRuns = 0;
		effect(() => { tree.user.deep(); userRuns++; });
		effect(() => { tree.count.get(); countRuns++; });
		await flush();

		tree.user.label.set('Grace');
		await flush();
		expect(userRuns).toBe(2);
		expect(countRuns).toBe(1); // unrelated branch, unaffected
	});

	it('branch .set() only notifies effects that read that branch', async () => {
		const tree = store(makeState());
		let userRuns = 0;
		let countRuns = 0;
		effect(() => { tree.user.deep(); userRuns++; });
		effect(() => { tree.count.get(); countRuns++; });
		await flush();

		tree.user.set({ label: 'Grace' });
		await flush();
		expect(userRuns).toBe(2);
		expect(countRuns).toBe(1);
	});

	it('an effect on the root re-runs when a nested leaf changes', async () => {
		const tree = store(makeState());
		let rootRuns = 0;
		effect(() => {
			tree.deep();
			rootRuns++;
		});
		await flush();
		expect(rootRuns).toBe(1);

		tree.user.label.set('Grace');
		await flush();
		expect(rootRuns).toBe(2);
		expect(tree.deep()).toEqual({ count: 0, user: { label: 'Grace', age: 30 }, tags: ['a', 'b'] });
	});

	it('branch .set() with an empty partial is a no-op for subscribers', async () => {
		const tree = store(makeState());
		let userRuns = 0;
		effect(() => { tree.user.get(); userRuns++; });
		await flush();

		tree.user.set({});
		await flush();
		expect(userRuns).toBe(1);
	});

	it('state on a plain object with a null prototype is still a branch', () => {
		const value = Object.assign(Object.create(null), { n: 1 }) as { n: number };
		const tree = store(value);
		expect(tree.n.get()).toBe(1);
		tree.n.set(2);
		expect(tree.deep()).toEqual({ n: 2 });
	});

	it('state on a non-object root is a single leaf signal tree', () => {
		const tree = store(42);
		expect(tree.get()).toBe(42);
		expect(tree.shallow()).toBe(42);
		expect(tree.deep()).toBe(42);
		expect(tree.peek()).toBe(42);
		tree.set(7);
		expect(tree.get()).toBe(7);
	});

	it('.set() with an unknown key adds a member; delete() removes it', () => {
		const tree = store(makeState());
		tree.user.set({ zip: 1 } as unknown as State['user']);
		expect(tree.user.deep()).toEqual({ label: 'Ada', age: 30, zip: 1 });
		expect((tree.user as unknown as Record<string, { get(): unknown }>).zip.get()).toBe(1);

		expect(tree.user.delete('zip')).toBe(true);
		expect(tree.user.delete('zip')).toBe(false);
		expect(tree.user.deep()).toEqual({ label: 'Ada', age: 30 });
	});

	it('object () tracks replacement only; shallow() also tracks add/delete', async () => {
		const tree = store(makeState());
		let callRuns = 0;
		let shallowRuns = 0;
		effect(() => { tree.user.get(); callRuns++; });
		effect(() => { tree.user.shallow(); shallowRuns++; });
		await flush();

		tree.user.label.set('Grace'); // member value change: neither
		await flush();
		expect([callRuns, shallowRuns]).toEqual([1, 1]);

		tree.user.delete('age'); // structural: shallow only
		await flush();
		expect([callRuns, shallowRuns]).toEqual([1, 2]);

		tree.user.set({ label: 'Lin' }); // patch of existing members: neither
		await flush();
		expect([callRuns, shallowRuns]).toEqual([1, 2]);

		tree.user.set({ age: 1 }); // new key replaces the record: both
		await flush();
		expect([callRuns, shallowRuns]).toEqual([2, 3]);
	});

	it('object (), shallow() and deep() return the same plain value', () => {
		const tree = store(makeState());
		expect(tree.user.get()).toEqual({ label: 'Ada', age: 30 });
		expect(tree.user.shallow()).toBe(tree.user.deep());
		expect(tree.user.get()).toBe(tree.user.deep());
	});
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
