// Turns `bind()`'s arguments into one `Binding`: model accessor + options, each defaulted per element.

import {
	defaultCoerce,
	defaultEquals,
	defaultEvent,
	describeTarget,
	readProperty,
	writeProperty,
} from './defaults.js';
import type { BindAccessor, BindOptions, BindTrack, BindSource, Binding, WritableSignal } from './types.js';

export function isWritableSignal(value: unknown): value is WritableSignal {
	return typeof value === 'function' && typeof (value as { set?: unknown }).set === 'function';
}

function isAccessor(value: unknown): value is BindSource {
	const source = value as Partial<BindSource> | null | undefined;
	return typeof source?.get === 'function' && typeof source?.set === 'function';
}

function trackedReader(state: WritableSignal, track: BindTrack): () => unknown {
	const read = track === 'replace' ? undefined : (state as Partial<Record<BindTrack, () => unknown>>)[track];
	return typeof read === 'function' ? () => read.call(state) : () => state();
}

export const BIND_USAGE = 'pass a signal (`bind(sig[, options])`) or `bind({ get, set, ... })`.';

/** `args` are exactly what `bind()` forwarded: `[signal, options?]` or `[{ get, set, ...options }]`. */
export function resolveBinding(args: readonly unknown[], element: Element, property: string): Binding {
	const [first, second] = args;
	let model: BindAccessor;
	let options: BindOptions;

	if (isWritableSignal(first)) {
		options = (second as BindOptions | undefined) ?? {};
		model = { get: trackedReader(first, options.track ?? 'deep'), set: v => (first as WritableSignal<unknown>).set(v as never) };
	} else if (isAccessor(first)) {
		const { get, set, ...rest } = first;
		model = { get, set };
		options = rest;
	} else {
		throw new Error(`std-ui bind() on ${describeTarget(element, property)}: ${BIND_USAGE}`);
	}

	return {
		model,
		view: {
			event: options.event ?? defaultEvent(element, property),
			read: options.read ?? readProperty,
			write: options.write ?? writeProperty,
		},
		equals: options.equals ?? defaultEquals(element, property),
		coerce: defaultCoerce(element, property),
	};
}
