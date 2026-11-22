import { once } from '../../../../dev/once.js';

/** DEV only: shadow DOM component queried a slot its template does not contain (usually a typo). */
export function warnMissingSlotElement(host: Element, slot: string): void {
	const tag = host.tagName.toLowerCase();
	once(
		`missing:${tag}:${slot}`,
		`[std-ui] <${tag}>: @queryAssignedNodes found no <slot${slot ? ` name="${slot}"` : ''}> in its shadow root. ` +
		`Check the slot name and that the template renders that <slot>.`,
	);
}
