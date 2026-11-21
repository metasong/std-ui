import { describe, expect, it } from 'vitest';
import type { SizeNode } from './data.js';
import { layoutTree } from './treemap-layout.js';

const leaf = (name: string, size: number): SizeNode => ({ name, size });
const dir = (name: string, children: SizeNode[]): SizeNode => ({
	name,
	size: children.reduce((s, c) => s + c.size, 0),
	children,
});

const tree = dir('root', [
	dir('a', [leaf('a1', 40), leaf('a2', 25), leaf('a3', 10)]),
	dir('b', [leaf('b1', 15), leaf('b2', 5)]),
	leaf('c', 5),
]);

describe('layoutTree', () => {
	const boxes = layoutTree(tree, 1000, 600);
	const leaves = boxes.filter((b) => b.leaf);

	it('lists parents before their children and covers the whole area with the root', () => {
		expect(boxes[0]).toMatchObject({ x: 0, y: 0, w: 1000, h: 600, depth: 0, leaf: false });
		expect(boxes.map((b) => b.node.name).indexOf('a')).toBeLessThan(boxes.map((b) => b.node.name).indexOf('a1'));
	});

	it('gives each leaf an area proportional to its size within its folder', () => {
		const area = (name: string) => {
			const b = leaves.find((l) => l.node.name === name)!;
			return b.w * b.h;
		};
		expect(area('a1') / area('a2')).toBeCloseTo(40 / 25, 5);
		expect(area('b1') / area('b2')).toBeCloseTo(15 / 5, 5);
	});

	it('keeps every child inside its parent and leaves never overlap', () => {
		for (const b of boxes) {
			expect(b.w).toBeGreaterThan(0);
			expect(b.h).toBeGreaterThan(0);
		}
		for (let i = 0; i < leaves.length; i++) {
			for (let j = i + 1; j < leaves.length; j++) {
				const p = leaves[i]!, q = leaves[j]!;
				const overlapW = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x);
				const overlapH = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
				expect(overlapW > 1e-6 && overlapH > 1e-6).toBe(false);
			}
		}
		const a = boxes.find((b) => b.node.name === 'a')!;
		for (const name of ['a1', 'a2', 'a3']) {
			const c = boxes.find((b) => b.node.name === name)!;
			expect(c.x).toBeGreaterThanOrEqual(a.x - 1e-6);
			expect(c.y).toBeGreaterThanOrEqual(a.y - 1e-6);
			expect(c.x + c.w).toBeLessThanOrEqual(a.x + a.w + 1e-6);
			expect(c.y + c.h).toBeLessThanOrEqual(a.y + a.h + 1e-6);
		}
	});

	it('tags boxes with the top-level group they belong to', () => {
		const groupOf = (name: string) => boxes.find((b) => b.node.name === name)!.group;
		expect(groupOf('root')).toBe(-1);
		expect(groupOf('a1')).toBe(groupOf('a'));
		expect(groupOf('b1')).toBe(groupOf('b'));
		expect(groupOf('a')).not.toBe(groupOf('b'));
	});

	it('skips zero-size nodes', () => {
		const out = layoutTree(dir('r', [leaf('x', 10), leaf('zero', 0)]), 100, 100);
		expect(out.some((b) => b.node.name === 'zero')).toBe(false);
	});
});
