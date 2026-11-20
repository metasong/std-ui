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

/**
 * Reactive getter for the router of the nearest `<std-router>` ancestor; undefined when there is none.
 * Call it inside effects so a later `router` assignment re-binds.
 */
export function findSignalBackedRouter(from: Node): (() => Router) | undefined {
	const host = findAncestor<StdRouter>(from, 'std-router');
	return host ? (() => host.router) : undefined;
}

/**
 * Number of `tagName` ancestors of `from` that belong to the same router, i.e. that sit below the nearest
 * `<std-router>`. Outlets of an enclosing router (a router nested in a routed page) are not counted.
 */
export function countAncestors(from: Node, tagName: string): number {
	const boundary = findAncestor(from, 'std-router');
	let count = 0;
	let node: Element | null = findAncestor(from, tagName);
	while (node && (!boundary || boundary.contains(node))) {
		count++;
		node = findAncestor(node, tagName);
	}
	return count;
}