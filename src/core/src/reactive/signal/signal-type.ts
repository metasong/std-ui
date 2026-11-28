// What counts as a signal for a template, `bind`, `@attribute` or `@provide` (read or write) and
// the guards that tell one from a plain value. A signal is a `Signal.State` / `Signal.Computed` of the
// installed `signal-polyfill` (so `state()` and `computed()` too), or a `store()` object / array
// node, which is a plain object behind a `Proxy` and carries a brand instead. See `./state.ts`.

import { Signal } from 'signal-polyfill';
import { DEV } from '../../dev/flag.js';
import { once } from '../../dev/once.js';
import { untrack } from './tracking.js';

/** The read side of a signal: what a consumer may do. Expose a private `State` under this type to hand out read-only access. */
export interface ReadableSignal<T = unknown> {
	/** Reads the current value and tracks it as a dependency. */
	get(): T;
	/** Reads the current value without tracking it as a dependency. Optional: where it is absent, use
	 * `untrack(() => x.get())`. `state()`, `computed()` and `store()` nodes all have it. */
	peek?(): T;
}

/** A signal that can be read and written: a `state()`, a standard `Signal.State`, or a `store()`
 * node. The one shape bind, `@attribute`, `@provide` and `defineContext` accept. `set` takes `T`, so
 * a `WritableSignal<number>` is type-checked on write. The bare `WritableSignal` (`T = unknown`) accepts
 * any value, and, `set` being a method, a typed node (a `State<number>`, or a tree branch whose `set`
 * takes a partial) is still assignable to it. */
export interface WritableSignal<T = unknown> extends ReadableSignal<T> {
	set(value: T): void;
}

/** A standard `Signal.State` or `Signal.Computed`: the only sources a `Watcher` can watch directly.
 * @internal Not exported from the `signal` folder (or the package) for now. */
export type StandardSignal = Signal.State<unknown> | Signal.Computed<unknown>;

/** Whether `value` is a `StandardSignal` (an instance of this copy's `Signal.State` / `Signal.Computed`).
 * Unlike `isReadableSignal`, a marked `store()` node is not one.
 * @internal Not exported from the `signal` folder (or the package) for now. */
export function isStandardSignal(value: unknown): value is StandardSignal {
	return value instanceof Signal.State || value instanceof Signal.Computed;
}

/** Brand for objects that act as signals but are not Signal instances (`store()` object / array nodes,
 * plain objects behind a `Proxy`). `Symbol.for`, so it matches across bundles of this library. */
const SIGNAL_BRAND = Symbol.for('std-ui.signal');

/** Marks a non-`Signal` object as a signal, so `isReadableSignal` / `isWritableSignal` accept it: a
 * `store()` node, or your own wrapper around `state()` / `computed()` (mark its prototype to cover every
 * instance). Its `get()` must read signals of this SAME `signal-polyfill` copy, or a binding never updates.
 *
 * `target`: the real `Signal.State` / `Signal.Computed` behind `node`, when it has one. Needed when `node` is
 * a `Proxy` (the polyfill's brand check fails on a proxy): `watchSignal()` watches `target` directly instead of
 * wrapping `node` in a `computed()`. `target.get()` must be the value `node.get()` returns. */
export function markSignal<T extends object>(node: T, target?: object): T {
	Object.defineProperty(node, SIGNAL_BRAND, { value: target ?? true });
	return node;
}

/** The `target` given to `markSignal(node, target)`, if any. */
export function signalTarget(value: unknown): object | undefined {
	const brand = typeof value === 'object' && value !== null ? (value as Record<symbol, unknown>)[SIGNAL_BRAND] : undefined;
	return typeof brand === 'object' && brand !== null ? brand : undefined;
}

const isMarked = (value: unknown): boolean =>
	typeof value === 'object' && value !== null && (value as Record<symbol, unknown>)[SIGNAL_BRAND] !== undefined;

/** DEV: a `State` / `Computed` that is not an instance of this copy's classes. The usual cause is a second copy
 * of the package (its classes are different, and it tracks in its own graph, so reads would not subscribe). */
function warnLookalike(value: unknown): void {
	if (typeof value !== 'object' || value === null) return;
	// Matched by class name, not by shape: a `Map` also has get() and set(), and must not warn.
	const name = (value as { constructor?: { name?: unknown } }).constructor?.name;
	if ((name === 'State' || name === 'Computed') && typeof (value as { get?: unknown }).get === 'function') {
		once(
			'foreign-signal',
			'std-ui: a Signal.State / Signal.Computed was not accepted as a signal. It likely comes from another copy of signal-polyfill; dedupe the package so one copy is installed (npm dedupe / overrides).',
		);
	}
}

/** Whether `value` is a `WritableSignal`: a `Signal.State` (so a `state()` too) or a marked `store()`
 * node with `set()`. Not structural, so a plain `{ get, set }` accessor is not one. A `Signal.State`
 * from another copy of `signal-polyfill` is not either (it cannot be tracked). Shared by bind, property
 * parts and attributes. */
export function isWritableSignal(value: unknown): value is WritableSignal {
	if (value instanceof Signal.State) return true;
	if (isMarked(value)) return typeof (value as { set?: unknown }).set === 'function';
	if (DEV) warnLookalike(value);
	return false;
}

/** Whether `value` is a `ReadableSignal`: a `Signal.State`, a `Signal.Computed` (so `state()` and
 * `computed()` too) or a marked `store()` node. Use it where a value is only read; use
 * `isWritableSignal` where it is written. */
export function isReadableSignal(value: unknown): value is ReadableSignal {
	if (value instanceof Signal.State || value instanceof Signal.Computed) return true;
	if (isMarked(value)) return true;
	if (DEV) warnLookalike(value);
	return false;
}

/** Untracked read of any `ReadableSignal`: its `peek()` when it has one, else `get()` outside tracking. */
export function peekSignal<T>(source: ReadableSignal<T>): T {
	return source.peek ? source.peek() : untrack(() => source.get());
}
