import { once } from '../../../../dev/once.js';

/** DEV only: light DOM children for `slot` exist now but were not there when the component connected. */
export function warnLateSlotChildren(host: Element, slot: string): void {
	const tag = host.tagName.toLowerCase();
	once(
		`late:${tag}:${slot}`,
		`[std-ui] <${tag}>: child with slot="${slot}" was added after the component connected, so it is ` +
		`not projected by slot() or returned by @querySlotted. Add children before the element ` +
		`is connected (e.g. build the subtree, then append it).`,
	);
}
