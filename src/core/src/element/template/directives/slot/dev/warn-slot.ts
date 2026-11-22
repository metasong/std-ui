import { once } from '../../../../../dev/once.js';

/** DEV only: `slot()` is the light-DOM mechanism; in a shadow-DOM component the native `<slot>` must be used. */
export function assertSlotDirectiveInLightDom(host: unknown): void {
	if (!(host instanceof Element)) return;
	const root = (host as { renderRoot?: Node }).renderRoot ?? host.shadowRoot;
	if (root instanceof ShadowRoot) {
		throw new Error(
			`std-ui slot(): <${host.tagName.toLowerCase()}> renders into a shadow root. slot() is for light DOM; ` +
			`use a native <slot> in the template instead.`,
		);
	}
}

/** DEV only: light DOM children for `slot` exist now but were not there when the component connected. */
export function warnLateSlotChildren(host: Element, slot: string): void {
	const tag = host.tagName.toLowerCase();
	once(
		`late:${tag}:${slot}`,
		`[std-ui] <${tag}>: child with slot="${slot}" was added after the component connected, so it is ` +
		`not projected by slot() or returned by @queryAssignedNodes. Add children before the element ` +
		`is connected (e.g. build the subtree, then append it).`,
	);
}
