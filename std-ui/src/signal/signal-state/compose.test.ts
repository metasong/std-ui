import { describe, expect, it } from 'vitest';
import { effect } from '../effect/index.js';
import { flushEffects } from '../effect/test-helpers.js';
import { signal } from '../core/index.js';
import { changes } from './changes/index.js';
import { state } from './main.js';

describe('state: circular plain data', () => {
	it('rejects an object that contains itself', () => {
		const a: Record<string, unknown> = {};
		a.self = a;
		expect(() => state(a)).toThrow(TypeError);
	});

	it('rejects an indirect cycle through descendants and arrays', () => {
		const a: Record<string, unknown> = { list: [] as unknown[] };
		const b = { parent: a };
		(a.list as unknown[]).push(b);
		expect(() => state(a)).toThrow(/circular/);
	});

	it('rejects a cyclic value passed to set() with a new key', () => {
		const tree = state<Record<string, unknown>>({});
		const cyc: Record<string, unknown> = {};
		cyc.me = cyc;
		expect(() => tree.set({ k: cyc })).toThrow(TypeError);
	});

	it('allows the same object referenced twice (DAG) as independent nodes', () => {
		const shared = { x: 1 };
		const tree = state({ a: shared, b: shared });
		tree.a.x.set(2);
		expect(tree.deep()).toEqual({ a: { x: 2 }, b: { x: 1 } });
	});
});

describe('state: adopting existing nodes', () => {
	it('uses an existing node as the member, not a leaf wrapper', () => {
		const inner = state({ x: 1 });
		const tree = state({ a: inner, n: 0 });
		expect(tree.a).toBe(inner);
		expect(tree.deep()).toEqual({ a: { x: 1 }, n: 0 });
	});

	it('returns the node itself when the root is already a node', () => {
		const inner = state({ x: 1 });
		expect(state(inner)).toBe(inner);
	});

	it('propagates inner changes to the parent deep() reads', async () => {
		const inner = state({ x: 1 });
		const tree = state({ a: inner });
		const seen: unknown[] = [];
		effect(() => void seen.push(tree.deep()));
		await flushEffects();
		inner.x.set(2);
		await flushEffects();
		expect(seen).toEqual([{ a: { x: 1 } }, { a: { x: 2 } }]);
	});

	it('shares the node: writes through either owner are visible to both', () => {
		const inner = state({ x: 1 });
		const t1 = state({ a: inner });
		const t2 = state({ a: inner });
		t1.a.x.set(5);
		expect(t2.deep()).toEqual({ a: { x: 5 } });
	});

	it('includes adopted nodes in the parent peek()', () => {
		const tree = state({ a: state({ x: 1 }) });
		expect(tree.peek()).toEqual({ a: { x: 1 } });
	});

	it('does not adopt plain core signals; they stay leaf values', () => {
		const s = signal(1);
		const tree = state({ s });
		expect(tree.s.peek()).toBe(s);
	});

	it('adopts nodes inside arrays', () => {
		const item = state({ x: 1 });
		const tree = state({ list: [item] });
		expect(tree.list[0]).toBe(item);
		item.x.set(3);
		expect(tree.list.deep()).toEqual([{ x: 3 }]);
	});

	it('the same node under two keys is shared', () => {
		const addr = state({ city: 'Paris' });
		const tree = state({ home: addr, work: addr });
		tree.home.city.set('Rome');
		expect(tree.deep()).toEqual({ home: { city: 'Rome' }, work: { city: 'Rome' } });
	});
});

describe('state: nodes are plain data to the parent', () => {
	it('object set() with plain data writes into the adopted node (shared with other owners)', () => {
		const addr = state({ city: 'Paris' });
		const user = state({ address: addr }).with(changes);
		user.set({ address: { city: 'Rome' } });
		expect(user.address).toBe(addr);
		expect(addr.peek()).toEqual({ city: 'Rome' });
	});

	it('object set() adds a new key built from a node, adopting it', () => {
		const tree = state<Record<string, unknown>>({});
		const n = state({ x: 1 });
		tree.set({ k: n });
		expect(tree.k).toBe(n);
	});

	it('array push / unshift / splice adopt nodes passed as new items', () => {
		const tree = state({ list: [{ x: 1 }] });
		const a = state({ x: 2 });
		const b = state({ x: 0 });
		const c = state({ x: 3 });
		tree.list.push(a);
		tree.list.unshift(b);
		tree.list.splice(1, 0, c);
		expect(tree.list[0]).toBe(b);
		expect(tree.list[1]).toBe(c);
		expect(tree.list[3]).toBe(a);
	});

	it('reset() writes the initial plain value into the adopted node', () => {
		const addr = state({ city: 'Paris' });
		const user = state({ address: addr }).with(changes);
		user.address.city.set('Rome');
		expect(user.changes.dirty()).toBe(true);
		user.changes.reset();
		expect(addr.peek()).toEqual({ city: 'Paris' });
		expect(user.changes.dirty()).toBe(false);
	});
});

describe('state: nodes are rejected for existing members', () => {
	it('object set() on an existing leaf key throws and leaves the tree unchanged', () => {
		const c = state<Record<string, unknown>>({ link: 1, other: 2 });
		const d = state({ x: 1 });
		expect(() => c.set({ other: 3, link: d })).toThrow(TypeError);
		expect(c.peek()).toEqual({ link: 1, other: 2 });
	});

	it('object set() on an existing object member throws instead of reading method names', () => {
		const tree = state<Record<string, unknown>>({ a: { x: 1 } });
		const d = state({ y: 2 });
		expect(() => tree.set({ a: d })).toThrow(TypeError);
		expect(tree.peek()).toEqual({ a: { x: 1 } });
	});

	it('object set() with the node under a new key still adopts it', () => {
		const c = state<Record<string, unknown>>({ link: 1 });
		const d = state({ x: 1 });
		c.set({ other: d });
		expect(c.other).toBe(d);
	});

	it('array set() with a node at an existing index throws and leaves the tree unchanged', () => {
		const tree = state({ list: [1, 2] as unknown[] });
		const d = state({ x: 1 });
		expect(() => tree.list.set([5, d])).toThrow(TypeError);
		expect(tree.list.peek()).toEqual([1, 2]);
	});

	it('array set() with a node past the current length adopts it', () => {
		const tree = state({ list: [1] as unknown[] });
		const d = state({ x: 1 });
		tree.list.set([1, d]);
		expect(tree.list[1]).toBe(d);
	});
});

describe('state: cycles through adopted nodes', () => {
	it('rejects attaching a node to itself via set()', () => {
		const a = state<Record<string, unknown>>({});
		expect(() => a.set({ self: a })).toThrow(/circular/);
	});

	it('rejects attaching an ancestor to its descendant', () => {
		const child = state<Record<string, unknown>>({});
		const root = state({ child });
		expect(() => child.set({ up: root })).toThrow(TypeError);
	});

	it('rejects a plain value that wraps a node containing the parent', () => {
		const child = state<Record<string, unknown>>({});
		const root = state({ child });
		expect(() => child.set({ k: { deeper: root } })).toThrow(TypeError);
	});

	it('rejects the same cycles through arrays', () => {
		const list = state({ list: [] as unknown[] }).list;
		expect(() => list.push(list)).toThrow(TypeError);
		const root = state({ list: [] as unknown[] });
		const inner = state<Record<string, unknown>>({});
		root.list.push(inner);
		expect(() => inner.set({ root })).toThrow(TypeError);
	});

	it('leaves the tree unchanged after a rejected insert', () => {
		const a = state<Record<string, unknown>>({ x: 1 });
		expect(() => a.set({ self: a })).toThrow();
		expect(a.peek()).toEqual({ x: 1 });
	});

	it('allows a node shared in two places without a cycle (DAG)', () => {
		const shared = state({ x: 1 });
		const root = state<Record<string, unknown>>({ a: shared });
		expect(() => root.set({ b: shared })).not.toThrow();
	});
});
