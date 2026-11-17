// Observable record: `signalObject()` is the signal-tree version of a plain object, mirroring
// `../array`. Each property is its own member node (built by the supplied `makeMember`), and which
// members exist is tracked by one signal. Consequently:
//   - `obj()`, `obj.shallow()` and `obj.deep()` all return the plain value; they differ in tracking:
//   - `obj()` re-runs only when `set()` replaces the member record (new key, clear);
//   - `obj.shallow()` also re-runs when members are added (`set()` with a new key) or `delete`d;
//   - `obj.deep()` re-runs on any member's value change, recursively;
//   - `obj.key` is the member node itself (untracked access), e.g. `obj.user.label.set('x')`.

import { computed, signal, type Signal } from '../../signal/index.js';
import {
	addWith,
	assertAcyclic,
	assertNotNode,
	inheritExtensions,
	readValue,
	type Extendable,
	type ItemNode,
} from '../node.js';

type Members = Record<string, ItemNode<unknown>>;

export interface SignalObject<T, M = Members, P = Partial<T>> extends Extendable {
	/**
	 * Reads the plain value, tracking only replacement of the member record: a `set()` that adds a
	 * key or clears / restores the object. Use `shallow()` to also track `delete`.
	 */
	(): T;
	/** Reads the plain value, tracking any change to which members exist. */
	shallow(): T;
	/** Reads the whole object as a plain value (tracks every member, recursively). */
	deep(): T;
	/** Deep-untracked snapshot. */
	peek(): T;
	/**
	 * Patches in place: existing members get `.set(value)` (recursing into containers), unknown keys
	 * become new members, omitted keys are untouched. `set(undefined | null)` clears the object so
	 * it reads as that value; members are kept so a later object `set()` restores it.
	 */
	set(partial: P): void;
	update(fn: (prev: T) => P): T;
	/** Removes the member `key`; returns whether anything was removed. */
	delete(key: string): boolean;
	/**
	 * Members only, with no API names: `obj._.check` is the member `check` even though `obj.check`
	 * is the validation API (once `check()` has been applied). Untracked, like `obj.key`. A member named `_` is `obj._._`.
	 */
	readonly _: M;
}

// Names reserved on the node: members share its property namespace (`obj.member`), and both
// `obj.api()` and `obj.member.api()` use the same property access, so API names must win over keys.
// `check` is reserved even though `check()` is a separate feature, so adding it never shadows a member.
const API = new Set(['set', 'update', 'peek', 'deep', 'shallow', 'delete', 'with', 'check', 'changes', '_']);
const hasOwn = (o: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(o, key);

export function signalObject<T, M = Members, P = Partial<T>>(
	initial: Record<string, unknown>,
	makeMember: (value: unknown) => ItemNode<unknown>,
): SignalObject<T, M, P> {
	const start: Members = {};
	for (const key of Object.keys(initial)) start[key] = makeMember(initial[key]);
	const members: Signal<Members> = signal(start, { equals: () => false });
	/** Which empty value the object reads as after `set(undefined | null)`, or `false` when intact. */
	let empty: false | { value: undefined | null } = false;

	const build = (m: Members, read: (n: ItemNode<unknown>) => unknown): T => {
		if (empty) return empty.value as T;
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(m)) out[key] = read(m[key]);
		return out as T;
	};

	const deep = computed(() => build(members(), readValue));
	// `delete` edits the record in place and only `set()` swaps in a new one, so with `Object.is`
	// cutoff `record` notifies on replacement only.
	const record = computed(() => members());
	// All three reads return the same plain value; they differ only in what they subscribe to.
	const self = (() => (record(), deep.peek())) as unknown as SignalObject<T, M, P>;
	self.deep = () => deep();
	self.shallow = () => (members(), deep.peek());
	self.peek = () => build(members.peek(), (n) => n.peek());
	// Only a membership change (new key, clear, restore) swaps in a new record; patching existing
	// members just notifies those members, so untouched siblings keep their deep value identity.
	self.set = (partial) => {
		const prev = members.peek();
		let next: Members | undefined;
		if (partial === undefined || partial === null) {
			if (empty && empty.value === partial) return;
			empty = { value: partial as undefined | null };
			next = { ...prev };
		} else {
			const entries = Object.entries(partial as object);
			// Validate first so a rejected value leaves the object untouched.
			for (const [key, value] of entries) if (hasOwn(prev, key)) assertNotNode(value);
			if (empty) {
				empty = false;
				next = { ...prev };
			}
			for (const [key, value] of entries) {
				if (hasOwn(prev, key)) prev[key].set(value);
				else {
					// A new member is built like at construction; a node inside `value` is adopted.
					const member = makeMember(value);
					assertAcyclic(proxy, member);
					inheritExtensions(proxy, member);
					(next ??= { ...prev })[key] = member;
				}
			}
		}
		if (next) members.set(next);
	};
	self.update = (fn) => {
		self.set(fn(self.peek()));
		return self.peek();
	};
	self.delete = (key) => {
		const m = members.peek();
		if (!hasOwn(m, key)) return false;
		delete m[key];
		members.set(m);
		return true;
	};

	addWith(self);

	// Escape hatch for members whose names collide with the API: a members-only view (`obj._.key`).
	const membersOnly = new Proxy({} as object, {
		get: (_, key) => (typeof key === 'string' && hasOwn(members.peek(), key) ? members.peek()[key] : undefined),
		has: (_, key) => typeof key === 'string' && hasOwn(members.peek(), key),
		ownKeys: () => Object.keys(members.peek()),
		getOwnPropertyDescriptor: (_, key) =>
			typeof key === 'string' && hasOwn(members.peek(), key)
				? { value: members.peek()[key], enumerable: true, configurable: true }
				: undefined,
	});
	Object.defineProperty(self, '_', { value: membersOnly });

	// Member access by property name (untracked), e.g. `obj.user`. API names win over members.
	const isMember = (key: string | symbol): key is string =>
		typeof key === 'string' && !API.has(key) && hasOwn(members.peek(), key);

	const proxy: SignalObject<T, M, P> = new Proxy(self, {
		get: (target, key, receiver) =>
			isMember(key) ? members.peek()[key] : Reflect.get(target, key, receiver),
		has: (target, key) => isMember(key) || Reflect.has(target, key),
	});
	return proxy;
}



