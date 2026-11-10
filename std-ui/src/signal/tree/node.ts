// Shared contract between the tree's container nodes (`./array`, `./object`) and their children.

/** Minimal node contract needed from each child node (satisfied by `Signal`, arrays, and objects). */
export interface ItemNode<T> {
	(): T;
	peek(): T;
	set(value: any): void;
}

/**
 * Tracked plain-value read of any signal. Every tree node has `deep()`; this also accepts plain
 * core / standard signals (`signal()`, `computed()`, `toSignal()`), which only have `()`.
 */
export function readValue<T>(node: ItemNode<T>): T {
	const deep = (node as { deep?: () => T }).deep;
	return typeof deep === 'function' ? deep() : node();
}
