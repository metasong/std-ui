import { computed } from '../core/computed.js';
import { effect } from '../core/effect.js';
import { signal } from '../core/signal.js';
import { assertNotInReactiveContext, untrack } from '../core/tracking.js';
import { toSubscribable } from './subscribable.js';
import type { ToSignal, ToSignalFromOptions, ToSignalSource } from './types.js';

type State<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Like `toSignal`, but the source is produced by a `factory` that may read signals. Whenever those
 * signals change, the previous subscription is torn down and `factory()` is re-run and
 * re-subscribed. Returning `null`/`undefined` from the factory means "no source right now".
 *
 * The last good value is kept while a new source is pending (stale-while-revalidate). A pending
 * error is cleared when the factory re-runs. Reading throws while the current source is in error.
 */
export function toSignalFrom<T>(
	factory: () => ToSignalSource<T> | null | undefined,
): ToSignal<T | undefined>;
export function toSignalFrom<T, const U extends T | null | undefined>(
	factory: () => ToSignalSource<T> | null | undefined,
	options: ToSignalFromOptions<T, U> & { initialValue: U },
): ToSignal<T | U>;
export function toSignalFrom<T>(
	factory: () => ToSignalSource<T> | null | undefined,
	options: ToSignalFromOptions<T, undefined>,
): ToSignal<T | undefined>;
export function toSignalFrom<T, U>(
	factory: () => ToSignalSource<T> | null | undefined,
	options: ToSignalFromOptions<T, U> = {},
): ToSignal<T | U | undefined> {
	assertNotInReactiveContext('toSignalFrom()');
	const userEquals = options.equals ?? Object.is;
	const initial: State<T | U | undefined> = { ok: true, value: options.initialValue };
	const state = signal<State<T | U | undefined>>(initial, {
		equals: (a, b) =>
			a !== initial && b !== initial && a.ok && b.ok && userEquals(a.value as T, b.value as T),
	});

	let lastValue: T | U | undefined = options.initialValue;
	let disposed = false;

	const stop = effect(onCleanup => {
		// Reset a stale error so a fresh source starts clean; keep the last good value.
		untrack(() => {
			if (!state.peek().ok) state.set({ ok: true, value: lastValue });
		});

		let source: ToSignalSource<T> | null | undefined;
		try {
			source = factory(); // tracked: signals read here drive re-subscription
		} catch (error) {
			untrack(() => state.set({ ok: false, error }));
			return;
		}
		if (source == null) return;

		untrack(() => {
			let active = true;
			let unsub: (() => void) | undefined;
			const end = (): void => {
				if (!active) return;
				active = false;
				unsub?.();
			};
			onCleanup(end);
			try {
				const result = toSubscribable(source).subscribe({
					next: value => {
						if (!active) return;
						lastValue = value;
						state.set({ ok: true, value });
					},
					error: error => {
						if (!active) return;
						state.set({ ok: false, error });
						end();
					},
					complete: end,
				});
				unsub = () => result.unsubscribe();
				if (!active) result.unsubscribe();
			} catch (error) {
				state.set({ ok: false, error });
			}
		});
	});

	const dispose = (): void => {
		if (disposed) return;
		disposed = true;
		stop();
	};
	options.onCleanup?.(dispose);

	const read = computed<T | U | undefined>(() => {
		const current = state();
		if (!current.ok) throw current.error;
		return current.value;
	});

	return Object.assign(read, { dispose }) as ToSignal<T | U | undefined>;
}
