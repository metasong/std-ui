// Property → attribute: called by `UIElement.connectedCallback()` (`../../ui-element.ts`) to wire
// one effect per reflecting attribute field (`@attribute({ reflect: true })` or
// `defineElement(..., { attributes })`) on a just-connected host, mirroring its store onto the
// host attribute (opt-in; plain store fields never appear here).

import { effect as createEffect } from '../../signal/index.js';
import { readValue, type ItemNode } from '../../signal/signal-state/index.js';
import { registerUIElementHooks } from '../../ui-element-hooks.js';
import { serializeAttribute } from './converter.js';
import { attributeDefs, resolveInferredConverter } from './metadata.js';

/**
 * For each `@attribute({ reflect: true })` field recorded on `host`'s constructor, creates an
 * effect that keeps the host attribute in sync with the field's backing signal, and hands the
 * effect's disposer to `registerEffectDisposer` so the caller can dispose it on disconnect.
 */
export function wireReflectedAttributes(host: HTMLElement, registerEffectDisposer: (dispose: () => void) => void): void {
	for (const def of attributeDefs.get(host.constructor)) {
		if (!def.reflect) continue;
		resolveInferredConverter(host, def);
		let prev: unknown; // previous property value; `undefined` on the first run
		registerEffectDisposer(createEffect(() => {
			const value = readValue((host as unknown as Record<PropertyKey, ItemNode<unknown>>)[def.key]);
			const oldValue = prev;
			prev = value;
			const serialized = serializeAttribute(value, oldValue, def.converter);
			if (serialized === undefined) return; // `toAttribute` returning `undefined` means leave untouched
			if (serialized === null) host.removeAttribute(def.attribute);
			else host.setAttribute(def.attribute, serialized);
		}));
	}
}

registerUIElementHooks({
	connected(el) {
		const disposers: Array<() => void> = [];
		wireReflectedAttributes(el, dispose => void disposers.push(dispose));
		return () => disposers.forEach(dispose => dispose());
	},
});
