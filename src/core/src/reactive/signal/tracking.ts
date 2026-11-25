import { Signal } from 'signal-polyfill';
import { DEV } from '../../dev/flag.js';
import { usageError } from '../../util.js';

// Thin layer over the TC39 signals polyfill (`signal-polyfill`). `state()` / `computed()` are
// real `Signal.State` / `Signal.Computed` subclasses, so they work with `Signal.subtle.Watcher` and
// any other standard-signal consumer directly. If the proposal changes (or a native `Signal`
// ships), the change is confined to this file and `state.ts` / `computed.ts`.

/** Low-level watcher from the signals proposal (`Signal.subtle.Watcher`). `effect()` is built on it. */
export const Watcher = Signal.subtle.Watcher;
export type Watcher = Signal.subtle.Watcher;

/** True while a `computed` or `effect` body is running (or during template render that tracks signals). */
export function inReactiveContext(): boolean {
	return Signal.subtle.currentComputed() !== undefined;
}

/**
 * Throws if called inside a tracked consumer (`computed` / `effect` / render that reads signals).
 * Use from helpers like `toSignal()` that must subscribe exactly once per call site.
 */
export function assertNotInReactiveContext(
	caller: string,
	message?: string,
): void {
	if (inReactiveContext()) {
		throw usageError(message ?? (DEV && `${caller} must not run while a computed, effect, or template is tracking dependencies — each call creates a new subscription. Create the signal once (field, \`connect()\`, or module scope), then read it inside reactive code.`), caller);
	}
}

/** Runs `fn` with no active consumer, so any signal/computed it reads is NOT tracked - even if
 * called from inside a `computed`/`effect`. Same as `Signal.subtle.untrack()`.
 * (`.peek()` is the single-read sibling of this.) */
export const untrack: <T>(fn: () => T) => T = Signal.subtle.untrack;
