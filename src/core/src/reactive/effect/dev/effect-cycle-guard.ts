// Cycle guard for `effect()`: detects effects that keep re-triggering each other (A writes what B
// reads, B writes what A reads) and throws instead of freezing the page in an endless microtask loop.
// See `../effect-cycles.md`.

/** Identity of a guarded effect (any object). */
type Watcher = object;
import { DEV } from '../../../dev/flag.js';

/**
 * Counts re-runs per effect across a chain of consecutive flushes. Once one effect exceeds `limit`
 * re-runs, `count()` calls `onTrip` (so the caller can drop its queue), resets itself, and throws.
 *
 * When `DEV` is on, each effect's creation site is captured as an `Error` (V8 formats `.stack`
 * lazily) and only turned into text when the error is built.
 *
 * Example of the error thrown in dev (frames point at where each `effect(...)` was created):
 *
 * ```
 * Error: effect re-ran more than 100 times in a row: probably a cycle between effects that write
 * signals each other reads.
 * Effect that hit the limit:
 *   - ran 100x, created at:
 *     at setupTodos (todo-section.ts:23:5)
 *     at connect (todo-section.ts:12:3)
 * Other effects re-running in the same chain:
 *   - ran 100x, created at:
 *     at setupStats (stats-section.ts:8:5)
 * ```
 */
export class CycleGuard {
	/** Re-run counts for the current chain; cleared once a flush leaves nothing pending. */
	readonly #runs = new Map<Watcher, number>();
	/** Creation-site `Error` of each live effect (dev only). */
	readonly #origins = new Map<Watcher, Error>();
	readonly #limit: number;
	readonly #onTrip: () => void;

	/** `onTrip` is called right before throwing, e.g. to clear the caller's pending queue. */
	constructor(limit: number, onTrip: () => void) {
		this.#limit = limit;
		this.#onTrip = onTrip;
	}

	/** Remembers where `watcher`'s effect was created. Call from `effect()`. */
	register(watcher: Watcher): void {
		if (DEV) this.#origins.set(watcher, new Error());
	}

	/** Forgets `watcher`. Call from the effect's dispose. */
	unregister(watcher: Watcher): void {
		this.#origins.delete(watcher);
		this.#runs.delete(watcher);
	}

	/** Counts one re-run of `watcher`; throws if it exceeded the limit. */
	count(watcher: Watcher): void {
		const n = (this.#runs.get(watcher) ?? 0) + 1;
		if (n > this.#limit) {
			const message = DEV ? describeCycle(this.#limit, this.#runs, this.#origins, watcher) : `effect re-ran more than ${this.#limit} times (cycle?)`;
			this.#onTrip();
			this.#runs.clear();
			throw new Error(message);
		}
		this.#runs.set(watcher, n);
	}

	/** Ends the chain (nothing pending any more). */
	reset(): void {
		this.#runs.clear();
	}
}

/** DEV only. A module-level function, not a method: class methods survive minification even when
 *  unreachable, so the long message text would ship in release builds. */
function describeCycle(
	limit: number,
	runs: ReadonlyMap<Watcher, number>,
	origins: ReadonlyMap<Watcher, Error>,
	offender: Watcher,
): string {
	const suspects = [...runs].filter(([w, n]) => w !== offender && n > 1);
	const fmt = (w: Watcher, n: number): string => `  - ran ${n}x, created at:\n${originOf(origins.get(w))}`;
	return [
		`effect re-ran more than ${limit} times in a row: probably a cycle between effects that write signals each other reads.`,
		`Effect that hit the limit:`,
		fmt(offender, limit),
		...(suspects.length
			? [`Other effects re-running in the same chain:`, ...suspects.map(([w, n]) => fmt(w, n))]
			: []),
	].join('\n');
}

/** First stack frames outside the signal core / dev helpers, i.e. the user's `effect(...)` call site. */
function originOf(error: Error | undefined): string {
	if (!error?.stack) return '    (unknown)';
	return error.stack
		.split('\n')
		.slice(1)
		.filter((l) => !/\/(?:effect|effect-cycle-guard)\.ts/.test(l))
		.slice(0, 3)
		.join('\n');
}
