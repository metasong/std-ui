import type { ReadonlySignal } from '@std-ui/core';
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
 * Reactive handle on the router of the nearest `<std-router>` ancestor; undefined when there is none
 * (or it is not upgraded yet). Read it inside effects so a later `router` assignment re-binds.
 */
export function findRouterSignal(from: Node): ReadonlySignal<Router | undefined> | undefined {
	return findAncestor<StdRouter>(from, 'std-router')?.routerSignal;
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
