/** Whether `value` is callable with a `.set()` - a signal/store. Shared by bind, property parts and attributes. */
export function isSettable(value: unknown): value is { (): unknown; set(value: never): void } {
	return typeof value === 'function' && typeof (value as { set?: unknown }).set === 'function';
}

/**
 * Error for API misuse. Call as `throw usageError(DEV && 'detailed message')`: with `DEV` the constant `false`
 * the message expression folds away at the call site (a closure or helper building it would survive
 * minification), so release builds keep one shared short message instead of a string per site.
 * `context` (the API that was misused, e.g. `'bind'`, `'@attribute'`) is the only per-site part kept in release.
 */
export function usageError(dev: string | false, context: string): Error {
	return new Error(dev || `std-ui ${context}: invalid usage (use development build for details)`);
}

/**
 * Tracked read of a signal at `depth`: `'deep'`/`'shallow'` use the matching method when the signal has one
 * (a state-tree node, so nested changes are tracked), otherwise - or for `'value'` - it is called directly.
 * Duck-typed so core has no dependency on state-tree.
 */
export function readSignal(signal: () => unknown, depth: 'value' | 'shallow' | 'deep' = 'deep'): unknown {
	const read = depth === 'value' ? undefined : (signal as unknown as Record<string, unknown>)[depth];
	return typeof read === 'function' ? read.call(signal) : signal();
}

/** `maxCount` -> `max-count`. */
export function kebab(name: string): string {
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
