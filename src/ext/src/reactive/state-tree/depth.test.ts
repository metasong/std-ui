import { describe, expect, it } from 'vitest';
import { effect } from '@std-ui/core';
import { flushEffects } from '../../../../core/src/reactive/effect/test-helpers.js';
import { stateTree } from './main.js';

const data = () => ({ id: 1, user: { name: 'Ada', tags: ['a'] } });

describe("state depth: 'value'", () => {
	it('builds one leaf for an object, holding the value as-is', () => {
		const input = data();
		const s = stateTree(input, { depth: 'value' });
		expect(s.peek()).toBe(input);
		expect((s as unknown as Record<string, unknown>).user).toBeUndefined(); // no members
		expect(s.deep()).toBe(input);
	});

	it('builds one leaf for an array too', () => {
		const input = [1, 2];
		const s = stateTree(input, { depth: 'value' });
		expect(s.peek()).toBe(input);
		expect(typeof (s as unknown as Record<string, unknown>).push).toBe('undefined');
	});

	it('only a whole replacement notifies', async () => {
		const s = stateTree(data(), { depth: 'value' });
		const seen: unknown[] = [];
		effect(() => void seen.push(s.get().id));
		await flushEffects();
		s.set({ ...data(), id: 2 });
		await flushEffects();
		expect(seen).toEqual([1, 2]);
	});

	it('forwards `equals` to the leaf', async () => {
		const s = stateTree(data(), { depth: 'value', equals: (a: { id: number }, b: { id: number }) => a.id === b.id });
		let runs = 0;
		effect(() => void (s.get(), runs++));
		await flushEffects();
		s.set({ ...data(), user: { name: 'Bob', tags: [] } }); // same id -> not a change
		await flushEffects();
		expect(runs).toBe(1);
	});

	it('shallow() and deep() are the same read as ()', () => {
		const s = stateTree(data(), { depth: 'value' });
		expect(s.shallow()).toBe(s.get());
		expect(s.deep()).toBe(s.get());
	});


	it('still adopts an existing node', () => {
		const node = stateTree({ x: 1 });
		expect(stateTree(node, { depth: 'value' })).toBe(node);
	});
});

describe("state depth: 'shallow'", () => {
	it('builds a container whose members are leaves holding raw values', () => {
		const input = data();
		const tree = stateTree(input, { depth: 'shallow' });
		expect(tree.id.get()).toBe(1);
		expect(tree.user.get()).toBe(input.user); // raw reference, not walked
		expect((tree.user as unknown as Record<string, unknown>).tags).toBeUndefined(); // no sub-members
		expect(tree.deep()).toEqual(data());
	});

	it('only replacing a member notifies, not mutating the raw value', async () => {
		const tree = stateTree(data(), { depth: 'shallow' });
		const seen: unknown[] = [];
		effect(() => void seen.push(tree.deep().user.name));
		await flushEffects();
		tree.user.set({ name: 'Bob', tags: [] });
		await flushEffects();
		expect(seen).toEqual(['Ada', 'Bob']);
		tree.user.get().name = 'Zed'; // in-place mutation of the raw value: no signal
		await flushEffects();
		expect(seen).toEqual(['Ada', 'Bob']);
	});

	it('deep() is shallow(): both re-run on member replacement and on structure changes', async () => {
		const tree = stateTree<Record<string, unknown>>({ a: 1 }, { depth: 'shallow' } as never);
		expect(tree.shallow).toBe(tree.deep);
		const viaShallow: unknown[] = [];
		const viaDeep: unknown[] = [];
		effect(() => void viaShallow.push({ ...tree.shallow() }));
		effect(() => void viaDeep.push({ ...tree.deep() }));
		await flushEffects();
		(tree.a as unknown as { set(v: unknown): void }).set(3); // member replacement
		tree.set({ b: 1 }); // structure change
		await flushEffects();
		expect(viaShallow).toEqual(viaDeep);
		expect(viaDeep.length).toBeGreaterThan(1);
		expect(viaDeep.at(-1)).toEqual({ a: 3, b: 1 });
	});

	it('shallow arrays also have deep() === shallow()', () => {
		const list = stateTree([1, 2], { depth: 'shallow' });
		expect(list.shallow).toBe(list.deep);
	});

	it('set(partial) patches members and a new key becomes a leaf', () => {
		const tree = stateTree<Record<string, unknown>>({ a: 1 }, { depth: 'shallow' } as never);
		tree.set({ a: 2, b: { flag: true } });
		expect(tree.peek()).toEqual({ a: 2, b: { flag: true } });
		expect((tree.b as unknown as Record<string, unknown>).flag).toBeUndefined(); // `b` is a leaf, `flag` is not a member
		expect(tree.delete('b')).toBe(true);
	});

	it('shallow arrays hold leaf items, including pushed ones', () => {
		const list = stateTree([{ n: 1 }], { depth: 'shallow' });
		list.push({ n: 2 });
		expect(list.deep()).toEqual([{ n: 1 }, { n: 2 }]);
		const first = list.at(0)!;
		expect((first as unknown as Record<string, unknown>).n).toBeUndefined(); // item is a leaf
		first.set({ n: 9 });
		expect(list.peek()).toEqual([{ n: 9 }, { n: 2 }]);
	});

	it('forwards `equals` to the member leaves', () => {
		const tree = stateTree({ p: { x: 1 } }, { depth: 'shallow', equals: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
		let runs = 0;
		effect(() => void (tree.p.get(), runs++));
		tree.p.set({ x: 1 }); // structurally equal -> no change
		expect(runs).toBe(1);
	});

	it('does not walk raw members, so a cycle inside one is not rejected', () => {
		const a: Record<string, unknown> = {};
		a.self = a;
		expect(() => stateTree({ a }, { depth: 'shallow' })).not.toThrow();
		expect(() => stateTree(a, { depth: 'value' })).not.toThrow();
		expect(() => stateTree({ a })).toThrow(TypeError); // deep still rejects
	});
});

describe('state depth: composing shallow nodes into a deep tree', () => {
	it('an adopted shallow node keeps its depth inside a deep parent', () => {
		const big = stateTree({ rows: [{ id: 1 }, { id: 2 }] }, { depth: 'shallow' });
		const page = stateTree({ title: 'T', big });
		expect(page.big).toBe(big);
		expect(page.big.rows.get()).toEqual([{ id: 1 }, { id: 2 }]); // raw array, one leaf
		expect((page.big.rows as unknown as Record<string, unknown>).push).toBeUndefined();
		expect(page.deep()).toEqual({ title: 'T', big: { rows: [{ id: 1 }, { id: 2 }] } });
	});

	it('replacing the shallow member notifies the deep parent', async () => {
		const big = stateTree({ rows: [1] }, { depth: 'shallow' });
		const page = stateTree({ big });
		const seen: unknown[] = [];
		effect(() => void seen.push(page.deep().big.rows.length));
		await flushEffects();
		big.rows.set([1, 2]);
		await flushEffects();
		expect(seen).toEqual([1, 2]);
	});

	it('a shallow parent adopts an existing node as a member', () => {
		const inner = stateTree({ x: 1 });
		const parent = stateTree({ inner, n: 0 }, { depth: 'shallow' });
		expect(parent.inner).toBe(inner);
		inner.x.set(5);
		expect(parent.deep()).toEqual({ inner: { x: 5 }, n: 0 });
	});

	it('a shallow parent tracks inside an adopted deep node', async () => {
		const inner = stateTree({ x: 1 });
		const parent = stateTree({ inner }, { depth: 'shallow' });
		const seen: unknown[] = [];
		effect(() => void seen.push(parent.deep().inner));
		await flushEffects();
		inner.x.set(5); // the adopted node is deep, so its changes reach the parent
		await flushEffects();
		expect(seen).toEqual([{ x: 1 }, { x: 5 }]);
	});

	it('a shallow array tracks inside adopted deep items', async () => {
		const item = stateTree({ n: 1 });
		const list = stateTree([item], { depth: 'shallow' });
		let runs = 0;
		effect(() => void (list.deep(), runs++));
		await flushEffects();
		item.n.set(2);
		await flushEffects();
		expect(runs).toBe(2);
	});

	it('but a raw object member of the shallow parent is not walked', async () => {
		const parent = stateTree({ raw: { x: 1 } }, { depth: 'shallow' });
		let runs = 0;
		effect(() => void (parent.deep(), runs++));
		await flushEffects();
		parent.raw.get().x = 2; // in-place mutation of a raw member: no signal
		await flushEffects();
		expect(runs).toBe(1);
	});

	it('a deep parent still tracks through the same adopted node', async () => {
		const inner = stateTree({ x: 1 });
		const parent = stateTree({ inner });
		let runs = 0;
		effect(() => void (parent.deep(), runs++));
		await flushEffects();
		inner.x.set(5);
		await flushEffects();
		expect(runs).toBe(2);
	});

	it('default depth is deep', () => {
		const tree = stateTree(data());
		expect(tree.user.name.get()).toBe('Ada');
		expect(tree.user.tags.deep()).toEqual(['a']);
	});
});
