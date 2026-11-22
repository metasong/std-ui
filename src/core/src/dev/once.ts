const warned = new Set<string>();

/** DEV helper: `console.warn` a message once per distinct key. */
export function once(key: string, message: string): void {
	if (warned.has(key)) return;
	warned.add(key);
	console.warn(message);
}
