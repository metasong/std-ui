/** Whether `value` is callable with a `.set()` - a signal/store. Shared by bind, property parts and attributes. */
export function isSettable(value: unknown): value is { (): unknown; set(value: never): void } {
	return typeof value === 'function' && typeof (value as { set?: unknown }).set === 'function';
}

/** `maxCount` -> `max-count`. */
export function kebab(name: string): string {
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
