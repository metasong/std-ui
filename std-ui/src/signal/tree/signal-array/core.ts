// Observable collection: `signalArray()` is the signal-tree version of an array. Each element is its
// own node (built by the supplied `makeItem`, so objects become branches and primitives leaves), and
// the list structure (which nodes, in what order) is tracked by one signal. Consequently:
//   - `list()` re-runs when items are added/removed/reordered OR any item's value changes;
//   - `list.at(i)()` only re-runs when that element changes (or the element at `i` is replaced).

import { computed, signal, type Computed, type Signal } from '../../core/index.js';

/** Minimal node contract needed from each element node (satisfied by `Signal` and branches). */
export interface ItemNode<T> {
	(): T;
	peek(): T;
	set(value: any): void;
}

export interface SignalArray<T, N extends ItemNode<T> = ItemNode<T>> {
	/** Reads the whole array (tracks structure and every item). */
	(): T[];
	/** Deep-untracked snapshot. */
	peek(): T[];
	/** Replaces the contents; existing nodes are reused by index, extras are created/dropped. */
	set(values: T[]): void;
	update(fn: (prev: T[]) => T[]): T[];

	/** Tracked length. */
	readonly length: Computed<number>;
	/**
	 * Tracked node at `index`, or `undefined` if out of range. Only notifies when the node at that
	 * index changes. Negative `index` counts from the end and is tracked separately from the positive
	 * index it currently resolves to (`-1` follows the last slot as the length changes).
	 */
	at(index: number): N | undefined;
	/**
	 * Untracked node at `index` (`array[1]`), read via `nodes.peek()`. Only non-negative integer
	 * indices; use `at()` for tracked or negative-index access.
	 */
	readonly [index: number]: N | undefined;
	/** Tracked the whole replacement and any structural changes, even when the length is the same */
	nodes(): readonly N[];

	/**
	 * Array-like mutators. `mutate` reads `nodes.peek()` so these do not subscribe; `nodes.set`
	 * still notifies `()`, `length`, `at`, and `nodes`. `pop` / `shift` / `splice` return untracked
	 * value snapshots (`node.peek()`), not tracked `node()` reads.
	 */
	push(...values: T[]): number;
	pop(): T | undefined;
	shift(): T | undefined;
	unshift(...values: T[]): number;
	splice(start: number, deleteCount?: number, ...values: T[]): T[];
	/** Removes the item at `index`; returns whether anything was removed. */
	remove(index: number): boolean;
	clear(): void;
}

export function signalArray<T, N extends ItemNode<T> = ItemNode<T>>(
	initial: readonly T[],
	makeItem: (value: T) => N,
): SignalArray<T, N> {
	const nodes: Signal<N[]> = signal(initial.map(makeItem), { equals: () => false });

	const read = computed(() => nodes().map((n) => n())) as Computed<T[]> & Partial<SignalArray<T, N>>;
	const self = read as unknown as SignalArray<T, N>;

	const snapshot = (list: readonly N[]): T[] => list.map((n) => n.peek());
	/** Copy-on-write structural edit; `peek` avoids tracking when mutators run inside effects. */
	const mutate = <R>(
		fn: (/** The copy of the nodes to be set back */ list: N[]) => R,
	): R => {
		const list = nodes.peek().slice();
		const result = fn(list);
		nodes.set(list);
		return result;
	};

	self.peek = () => snapshot(nodes.peek());
	self.set = (values) => {
		mutate((list) => {
			values.forEach((v, i) => (i < list.length ? list[i].set(v) : list.push(makeItem(v))));
			list.length = values.length;
		});
	};
	self.update = (fn) => {
		self.set(fn(self.peek()));
		return self.peek();
	};

	// Tracked length. Use a computed rather than reading `nodes()` directly: `nodes` is created with
	// `equals: () => false` (notifies on every mutation, even same-size ones like `set()` or in-place
	// replacement), whereas a computed only notifies dependents when the length value actually changes.
	// It also satisfies the `Computed<number>` type on the interface.
	Object.defineProperty(self, 'length', { value: computed(() => nodes().length) });

	// One cached computed per requested index: dependents only re-run when the node at that index
	// actually changes (default `Object.is` equality), not on every structural edit.
	// NOTE: negative indices are deliberately NOT normalized to positive ones. `-1` means "the last
	// slot", which moves as the length changes, so it must be keyed separately from the positive
	// index it happens to resolve to right now (`at(-1)` and `at(2)` on a 3-item list are different
	// computeds). Normalizing would need an untracked length (stale) or a tracked one (defeats the cache).
	const atCache = new Map<number, Computed<N | undefined>>();
	self.at = (index) => {
		let c = atCache.get(index);
		if (!c) {
			c = computed(() => {
				const list = nodes();
				return list[index < 0 ? list.length + index : index];
			});
			atCache.set(index, c);
		}
		return c();
	};
	self.nodes = () => nodes();

	self.push = (...values) => mutate((l) => l.push(...values.map(makeItem)));
	self.unshift = (...values) => mutate((l) => l.unshift(...values.map(makeItem)));
	self.pop = () => mutate((l) => l.pop()?.peek());
	self.shift = () => mutate((l) => l.shift()?.peek());
	self.splice = (start, deleteCount, ...values) =>
		mutate((l) =>
			l.splice(start, deleteCount ?? l.length, ...values.map(makeItem))
			 .map((n) => n.peek()),
		);
	self.remove = (index) => {
		if (index < 0 || index >= nodes.peek().length) return false;
		mutate((l) => l.splice(index, 1));
		return true;
	};
	self.clear = () => {
		if (nodes.peek().length) mutate((l) => void (l.length = 0));
	};

	const isIndex = (key: string | symbol): key is string =>
		typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key);

	return new Proxy(self, {
		get: (target, key, receiver) => // key can be number or any string or symbol
			isIndex(key) ? nodes.peek()[Number(key)] : Reflect.get(target, key, receiver),
		has: (target, key) => // `1 in array` is true when that index exists
			isIndex(key) ? Number(key) < nodes.peek().length : Reflect.has(target, key),
	});
}
