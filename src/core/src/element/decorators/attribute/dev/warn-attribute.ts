import { DEV } from '../../../../dev/flag.js';

const warned = new Set<string>();

/**
 * DEV only: `@attribute({ reflect: true })` (or `defineElement` `reflect: true`) was used on a plain field. Reflecting
 * a property back onto its attribute means observing writes to it, which only a `state()` store allows.
 */
export function warnReflectNeedsStore(host: Element, key: PropertyKey): void {
	if (!DEV) return;
	const tag = host.tagName.toLowerCase();
	const id = `${tag}:${String(key)}`;
	if (warned.has(id)) return;
	warned.add(id);
	console.warn(
		`[std-ui] <${tag}>: @attribute({ reflect: true }) on "${String(key)}" has no effect - the field is not a state() store, ` +
		`so writes to it cannot be observed. Make it a state() store to reflect it, or drop \`reflect\`.`,
	);
}
