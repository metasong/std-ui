import type { SizeNode } from './data.js';

export type Rect = { x: number; y: number; w: number; h: number };

export type LayoutBox = Rect & {
	readonly node: SizeNode;
	readonly depth: number;
	readonly leaf: boolean;
	/** Index of the top-level group (child of the root) this box belongs to; -1 for the root. */
	readonly group: number;
	/** Height reserved at the top for the folder name (0 when the folder is too small). */
	readonly header: number;
};

const PALETTE = [210, 160, 35, 285, 355, 185, 95, 320, 50, 245];
export const groupHue = (group: number): number => PALETTE[Math.max(group, 0) % PALETTE.length]!;

const worst = (row: readonly number[], side: number): number => {
	const s = row.reduce((a, b) => a + b, 0);
	return Math.max((side * side * Math.max(...row)) / (s * s), (s * s) / (side * side * Math.min(...row)));
};

/** Squarified treemap: `areas` sorted descending and summing to `rect.w * rect.h`. */
const squarify = (areas: readonly number[], rect: Rect): Rect[] => {
	const out: Rect[] = [];
	let { x, y, w, h } = rect;
	let i = 0;
	while (i < areas.length) {
		const side = Math.min(w, h);
		const row = [areas[i]!];
		let j = i + 1;
		while (j < areas.length && worst([...row, areas[j]!], side) <= worst(row, side)) row.push(areas[j++]!);
		const s = row.reduce((a, b) => a + b, 0);
		if (w >= h) {
			const cw = s / h;
			let cy = y;
			for (const a of row) { out.push({ x, y: cy, w: cw, h: a / cw }); cy += a / cw; }
			x += cw; w -= cw;
		} else {
			const rh = s / w;
			let cx = x;
			for (const a of row) { out.push({ x: cx, y, w: a / rh, h: rh }); cx += a / rh; }
			y += rh; h -= rh;
		}
		i = j;
	}
	return out;
};

const PAD = 3;
const HEADER = 20;

/**
 * Lays the tree out in a `width` x `height` virtual space; returns boxes parent-first (paint order).
 * With `rootHeader`, the root is drawn as a folder level too (header bar + padding) instead of a bare frame.
 */
export const layoutTree = (root: SizeNode, width: number, height: number, rootHeader = false): LayoutBox[] => {
	const boxes: LayoutBox[] = [];
	const visit = (node: SizeNode, rect: Rect, depth: number, group: number): void => {
		const kids = node.children?.filter((c) => c.size > 0);
		if (!kids?.length) {
			boxes.push({ ...rect, node, depth, leaf: true, group, header: 0 });
			return;
		}
		const isBareRoot = depth === 0 && !rootHeader; // the root is an invisible frame unless it gets a header like any folder
		const header = !isBareRoot && rect.h > HEADER * 2.2 && rect.w > 56 ? HEADER : 0;
		boxes.push({ ...rect, node, depth, leaf: false, group, header });
		const pad = isBareRoot ? 0 : PAD;
		const inner: Rect = { x: rect.x + pad, y: rect.y + pad + header, w: rect.w - pad * 2, h: rect.h - pad * 2 - header };
		if (inner.w <= 1 || inner.h <= 1) return;
		const sorted = [...kids].sort((a, b) => b.size - a.size);
		const total = sorted.reduce((s, c) => s + c.size, 0);
		const rects = squarify(sorted.map((c) => (c.size / total) * inner.w * inner.h), inner);
		sorted.forEach((c, i) => visit(c, rects[i]!, depth + 1, depth === 0 ? i : group));
	};
	visit(root, { x: 0, y: 0, w: width, h: height }, 0, -1);
	return boxes;
};

export const labelPath = (node: SizeNode): string => node.path ?? node.name;

export const displayName = (node: SizeNode): string => node.name.replace(/\.js$/, '');