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

/** `maxCount` -> `max-count`. */
export function kebab(name: string): string {
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
