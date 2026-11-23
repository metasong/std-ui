// Turns `bind()`'s arguments into one `Binding`: model accessor + options, each defaulted per element.

import {
	defaultCoerce,
	defaultEquals,
	defaultEvent,
	describeTarget,
	readProperty,
	writeProperty,
} from './defaults.js';
import type { BindAccessor, BindDepth, BindOptions, BindSource, Binding, WritableSignal } from './types.js';
import { DEV } from '../../../../dev/flag.js';
import { isSettable } from '../../../../util.js';
import { usageError } from '../../../../util.js';

export const isWritableSignal = isSettable as (value: unknown) => value is WritableSignal;

function isAccessor(value: unknown): value is BindSource {
	const source = value as Partial<BindSource> | null | undefined;
	return typeof source?.get === 'function' && typeof source?.set === 'function';
}

function trackedReader(state: WritableSignal, depth: BindDepth): () => unknown {
	const read = depth === 'value' ? undefined : (state as unknown as Partial<Record<BindDepth, () => unknown>>)[depth];
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
		model = { get: trackedReader(first, options.depth ?? 'deep'), set: v => (first as WritableSignal<unknown>).set(v as never) };
	} else if (isAccessor(first)) {
		const { get, set, ...rest } = first;
		model = { get, set };
		options = rest;
	} else {
		throw usageError(DEV && `std-ui bind() on ${describeTarget(element, property)}: ${BIND_USAGE}`, 'bind');
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
