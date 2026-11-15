// Observable collection: `signalArray()` is the signal-tree version of an array. Each element is its
// own node (built by the supplied `makeItem`, so objects become branches and primitives leaves), and
// the list structure (which nodes, in what order) is tracked by one signal. Consequently:
//   - `list()`, `list.shallow()` and `list.deep()` all return plain values; they differ in tracking:
//   - `list()` re-runs only on whole replacement via `set()`;
//   - `list.shallow()` also re-runs when items are added/removed/reordered;
//   - `list.deep()` re-runs on structure OR any item's value change;
//   - `list.at(i)()` only re-runs when that element changes (or the element at `i` is replaced).

import { computed, signal, type Computed, type Signal } from '../../core/index.js';
import {
	addWith,
	assertAcyclic,
	assertNotNode,
	inheritExtensions,
	readValue,
	type Extendable,
	type ItemNode,
} from '../node.js';

export interface SignalArray<T, N extends ItemNode<T> = ItemNode<T>> extends Extendable {
	/**
	 * Reads the plain values, tracking only whole replacement via `set()` / `update()` (like a plain
	 * `signal(array)`). Use `shallow()` to also track push/pop/splice etc.
	 */
	(): T[];
	/**
	 * Reads the plain values, tracking whole replacement and any structural change,
	 * even when the length is the same.
	 */
	shallow(): T[];
	/** Reads the whole array as plain values (tracks structure and every item, recursively). */
	deep(): T[];
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
	/** Deep-untracked snapshot. */
	peek(): T[];

	/** Replaces the contents; existing nodes are reused by index, extras are created/dropped. */
	set(values: T[]): void;
	update(fn: (prev: T[]) => T[]): T[];

	/**
	 * Array-like mutators. `mutate` reads `nodes.peek()` so these do not subscribe; `nodes.set`
	 * still notifies `deep()`, `length`, `at`, and `shallow()`. `pop` / `shift` / `splice` return untracked
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
	let proxy: SignalArray<T, N>; // the node users hold; assigned at the end
	/** Builds an item for a later insert (a node inside `value` is adopted), rejecting a cycle. */
	const make = (value: T): N => {
		const node = makeItem(value);
		assertAcyclic(proxy, node);
		inheritExtensions(proxy, node);
		return node;
	};
	const deep = computed(() => nodes().map(readValue));
	// Mutators edit the node array in place and only `set()` swaps in a new one, so with `Object.is`
	// cutoff `instance` notifies on replacement only, like a plain `signal(array)`.
	const instance = computed(() => nodes());
	// All three reads return the same plain values; they differ only in what they subscribe to.
	const self = (() => (instance(), deep.peek())) as unknown as SignalArray<T, N>;
	self.deep = () => deep();

	const snapshot = (list: readonly N[]): T[] => list.map((n) => n.peek());
	/** In-place structural edit; `peek` avoids tracking when mutators run inside effects. */
	const mutate = <R>(fn: (list: N[]) => R): R => {
		const list = nodes.peek();
		const result = fn(list);
		nodes.set(list);
		return result;
	};

	self.peek = () => snapshot(nodes.peek());
	self.set = (values) => {
		const prev = nodes.peek();
		// Validate first so a rejected value leaves earlier items unwritten.
		values.forEach((v, i) => i < prev.length && assertNotNode(v));
		nodes.set(values.map((v, i) => (i < prev.length ? (prev[i].set(v), prev[i]) : make(v))));
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
	self.shallow = () => (nodes(), deep.peek());

	self.push = (...values) => mutate((l) => l.push(...values.map(make)));
	self.unshift = (...values) => mutate((l) => l.unshift(...values.map(make)));
	self.pop = () => mutate((l) => l.pop()?.peek());
	self.shift = () => mutate((l) => l.shift()?.peek());
	self.splice = (start, deleteCount, ...values) =>
		mutate((l) =>
			l.splice(start, deleteCount ?? l.length, ...values.map(make))
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

	addWith(self);

	const isIndex = (key: string | symbol): key is string =>
		typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key);

	proxy = new Proxy(self, {
		get: (target, key, receiver) => // key can be number or any string or symbol
			isIndex(key) ? nodes.peek()[Number(key)] : Reflect.get(target, key, receiver),
		has: (target, key) => // `1 in array` is true when that index exists
			isIndex(key) ? Number(key) < nodes.peek().length : Reflect.has(target, key),
	});
	return proxy;
}




