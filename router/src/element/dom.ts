import type { Router } from '../router/router.js';
import type { StdRouter } from './std-router.js';

/** Nearest ancestor with `tagName`, crossing shadow-root boundaries. */
export function findAncestor<T extends Element>(from: Node, tagName: string): T | null {
	const upper = tagName.toUpperCase();
	let node: Node | null = from.parentNode;
	while (node) {
		if (node instanceof ShadowRoot) node = node.host;
		else {
			if (node instanceof Element && node.tagName === upper) return node as T;
			node = node.parentNode;
		}
	}
	return null;
}

/** The `Router` of the nearest `<std-router>` ancestor, or undefined (none, or not yet upgraded). */
export function findRouter(from: Node): Router | undefined {
	return findAncestor<StdRouter>(from, 'std-router')?.router;
}

export function countAncestors(from: Node, tagName: string): number {
	let count = 0;
	let node: Element | null = findAncestor(from, tagName);
	while (node) {
		count++;
		node = findAncestor(node, tagName);
	}
	return count;
}
