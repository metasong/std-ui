import { describe, expect, it } from 'vitest';
import { effect } from '../core/index.js';
import { signalState } from './core.js';

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

describe('signalState', () => {
	it('mirrors a plain object: reading the root reassembles every leaf', () => {
		const tree = signalState(makeState());
		expect(tree()).toEqual(makeState());
	});

	it('exposes each branch/leaf as a same-named property', () => {
		const tree = signalState(makeState());
		expect(tree.count()).toBe(0);
		expect(tree.user()).toEqual({ label: 'Ada', age: 30 });
		expect(tree.user.label()).toBe('Ada');
	});

	it('treats arrays as leaves, not branches', () => {
		const tree = signalState(makeState());
		expect(tree.tags()).toEqual(['a', 'b']);
		expect(typeof tree.tags.set).toBe('function');
	});

	it('replaces an array leaf wholesale via .set() on the leaf or root .set({ tags })', () => {
		const tree = signalState(makeState());
		tree.tags.set(['x']);
		expect(tree.tags()).toEqual(['x']);
		expect(tree()).toEqual({ ...makeState(), tags: ['x'] });

		tree.set({ tags: ['y', 'z'] });
		expect(tree.tags()).toEqual(['y', 'z']);
	});

	it('a leaf .set() is reflected when reading its ancestor branches', () => {
		const tree = signalState(makeState());
		tree.user.label.set('Grace');
		expect(tree.user.label()).toBe('Grace');
		expect(tree.user()).toEqual({ label: 'Grace', age: 30 });
		expect(tree()).toEqual({ count: 0, user: { label: 'Grace', age: 30 }, tags: ['a', 'b'] });
	});

	it('peek() snapshots the current value without tracking it as a dependency', async () => {
		const tree = signalState(makeState());
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
		const tree = signalState(makeState());
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
		const tree = signalState(makeState());
		tree.user.set({ label: 'Grace' });
		expect(tree.user()).toEqual({ label: 'Grace', age: 30 });
	});

	it('set() on the root recurses into nested branches', () => {
		const tree = signalState(makeState());
		tree.set({ count: 5, user: { age: 31 } });
		expect(tree()).toEqual({ count: 5, user: { label: 'Ada', age: 31 }, tags: ['a', 'b'] });
	});

	it('set() skips keys whose value is undefined', () => {
		const tree = signalState(makeState());
		tree.set({ count: undefined, user: { label: 'Grace' } });
		expect(tree.count()).toBe(0);
		expect(tree.user.label()).toBe('Grace');
	});

	it('setting one branch only notifies effects that read that branch', async () => {
		const tree = signalState(makeState());
		let userRuns = 0;
		let countRuns = 0;
		effect(() => { tree.user(); userRuns++; });
		effect(() => { tree.count(); countRuns++; });
		await flush();

		tree.user.label.set('Grace');
		await flush();
		expect(userRuns).toBe(2);
		expect(countRuns).toBe(1); // unrelated branch, unaffected
	});

	it('branch .set() only notifies effects that read that branch', async () => {
		const tree = signalState(makeState());
		let userRuns = 0;
		let countRuns = 0;
		effect(() => { tree.user(); userRuns++; });
		effect(() => { tree.count(); countRuns++; });
		await flush();

		tree.user.set({ label: 'Grace' });
		await flush();
		expect(userRuns).toBe(2);
		expect(countRuns).toBe(1);
	});

	it('an effect on the root re-runs when a nested leaf changes', async () => {
		const tree = signalState(makeState());
		let rootRuns = 0;
		effect(() => {
			tree();
			rootRuns++;
		});
		await flush();
		expect(rootRuns).toBe(1);

		tree.user.label.set('Grace');
		await flush();
		expect(rootRuns).toBe(2);
		expect(tree()).toEqual({ count: 0, user: { label: 'Grace', age: 30 }, tags: ['a', 'b'] });
	});

	it('branch .set() with an empty partial is a no-op for subscribers', async () => {
		const tree = signalState(makeState());
		let userRuns = 0;
		effect(() => { tree.user(); userRuns++; });
		await flush();

		tree.user.set({});
		await flush();
		expect(userRuns).toBe(1);
	});

	it('signalState on a plain object with a null prototype is still a branch', () => {
		const value = Object.assign(Object.create(null), { n: 1 }) as { n: number };
		const tree = signalState(value);
		expect(tree.n()).toBe(1);
		tree.n.set(2);
		expect(tree()).toEqual({ n: 2 });
	});

	it('signalState on a non-object root is a single leaf signal tree', () => {
		const tree = signalState(42);
		expect(tree()).toBe(42);
		expect(tree.peek()).toBe(42);
		tree.set(7);
		expect(tree()).toBe(7);
	});
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
