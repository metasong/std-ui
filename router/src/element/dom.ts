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

export function countAncestors(from: Node, tagName: string): number {
	let count = 0;
	let node: Element | null = findAncestor(from, tagName);
	while (node) {
		count++;
		node = findAncestor(node, tagName);
	}
	return count;
}
