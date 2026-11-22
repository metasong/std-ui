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
