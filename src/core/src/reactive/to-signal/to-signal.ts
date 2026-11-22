import { computed } from '../signal/computed.js';
import { state } from '../signal/state.js';
import { assertNotInReactiveContext, untrack } from '../signal/tracking.js';
import { toSubscribable } from './subscribable.js';
import type { ToSignal, ToSignalOptions, ToSignalSource, Unsubscribable } from './types.js';

const enum Kind { Value, Error }
type State<T> = { kind: Kind.Value; value: T } | { kind: Kind.Error; error: unknown };

export function toSignal<T>(source: ToSignalSource<T>): ToSignal<T | undefined>;
export function toSignal<T, const U extends T | null | undefined>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, U> & { initialValue: U },
): ToSignal<T | U>;
export function toSignal<T>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, undefined>,
): ToSignal<T | undefined>;
export function toSignal<T, U>(
	source: ToSignalSource<T>,
	options: ToSignalOptions<T, U> = {},
): ToSignal<T | U | undefined> {
	assertNotInReactiveContext('toSignal()');
	const userEquals = options.equals ?? Object.is;
	const initial: State<T | U | undefined> = { kind: Kind.Value, value: options.initialValue };
	const cell = state<State<T | U | undefined>>(initial, {
		// The initial value is type `U`, not `T`, so never hand it to the user's `equals`.
		equals: (a, b) =>
			a !== initial && b !== initial &&
			a.kind === Kind.Value && b.kind === Kind.Value && userEquals(a.value as T, b.value as T),
	});

	let sub: Unsubscribable | undefined;
	let disposed = false;
	const dispose = (): void => {
		if (disposed) return;
		disposed = true;
		sub?.unsubscribe();
	};

	// Register first so a throwing subscribe still has teardown wired.
	options.onCleanup?.(dispose);

	untrack(() => {
		const observable = toSubscribable(source);
		const result = observable.subscribe({
			next: value => { if (!disposed) cell.set({ kind: Kind.Value, value }); },
			error: error => {
				if (disposed) return;
				cell.set({ kind: Kind.Error, error });
				dispose();
			},
			complete: dispose,
		});
		sub = result;
		if (disposed) result.unsubscribe();
	});

	const read = computed<T | U | undefined>(() => {
		const current = cell();
		if (current.kind === Kind.Error) throw current.error;
		return current.value;
	});

	return Object.assign(read, { dispose }) as ToSignal<T | U | undefined>;
}
