import { describe, expect, it } from 'vitest';
import { effect } from './signal.js';
import { buildSignalTree } from './tree.js';

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

describe('buildSignalTree', () => {
	it('mirrors a plain object: reading the root reassembles every leaf', () => {
		const tree = buildSignalTree(makeState());
		expect(tree()).toEqual(makeState());
	});

	it('exposes each branch/leaf as a same-named property', () => {
		const tree = buildSignalTree(makeState());
		expect(tree.count()).toBe(0);
		expect(tree.user()).toEqual({ label: 'Ada', age: 30 });
		expect(tree.user.label()).toBe('Ada');
	});

	it('treats arrays as leaves, not branches', () => {
		const tree = buildSignalTree(makeState());
		expect(tree.tags()).toEqual(['a', 'b']);
		expect(typeof (tree.tags as unknown as { patch?: unknown }).patch).toBe('function');
	});

	it('a leaf .set() is reflected when reading its ancestor branches', () => {
		const tree = buildSignalTree(makeState());
		tree.user.label.set('Grace');
		expect(tree.user.label()).toBe('Grace');
		expect(tree.user()).toEqual({ label: 'Grace', age: 30 });
		expect(tree()).toEqual({ count: 0, user: { label: 'Grace', age: 30 }, tags: ['a', 'b'] });
	});

	it('peak() snapshots the current value without tracking it as a dependency', async () => {
		const tree = buildSignalTree(makeState());
		expect(tree.peak()).toEqual(makeState());

		let runs = 0;
		effect(() => {
			tree.user.peak();
			runs++;
		});
		await flush();
		const before = runs;

		tree.user.label.set('Grace');
		await flush();
		expect(runs).toBe(before); // no re-run: `peak()` didn't register a dependency
	});

	it('patch() writes only the provided leaves, leaving others untouched', () => {
		const tree = buildSignalTree(makeState());
		tree.user.patch({ label: 'Grace' });
		expect(tree.user()).toEqual({ label: 'Grace', age: 30 });
	});

	it('patch() on the root recurses into nested branches', () => {
		const tree = buildSignalTree(makeState());
		tree.patch({ count: 5, user: { age: 31 } });
		expect(tree()).toEqual({ count: 5, user: { label: 'Ada', age: 31 }, tags: ['a', 'b'] });
	});

	it('patch() skips keys whose value is undefined', () => {
		const tree = buildSignalTree(makeState());
		tree.patch({ count: undefined, user: { label: 'Grace' } });
		expect(tree.count()).toBe(0);
		expect(tree.user.label()).toBe('Grace');
	});

	it('patching one branch only notifies effects that read that branch', async () => {
		const tree = buildSignalTree(makeState());
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
});

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
