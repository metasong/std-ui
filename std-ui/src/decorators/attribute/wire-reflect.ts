// Property → attribute: called by `UIElement.connectedCallback()` (`../../ui-element.ts`) to wire
// one effect per `@attribute({ reflect: true })` field (`./attribute.decorator.ts`) on a
// just-connected host, mirroring its backing signal onto the host attribute (opt-in; `@state()`
// fields never appear here).

import { effect as createEffect } from '../../signal/index.js';
import { serializeAttribute } from './converter.js';
import { getAttributeDefs } from './metadata.js';

/**
 * For each `@attribute({ reflect: true })` field recorded on `host`'s constructor, creates an
 * effect that keeps the host attribute in sync with the field's backing signal, and hands the
 * effect's disposer to `registerEffectDisposer` so the caller can dispose it on disconnect.
 */
export function wireReflectedAttributes(host: HTMLElement, registerEffectDisposer: (dispose: () => void) => void): void {
	for (const def of getAttributeDefs(host.constructor)) {
		if (!def.reflect) continue;
		registerEffectDisposer(createEffect(() => {
			const value = (host as unknown as Record<PropertyKey, () => unknown>)[def.key]();
			const serialized = serializeAttribute(value, def.converter);
			if (serialized === undefined) return; // `toAttribute` returning `undefined` means leave untouched
			if (serialized === null) host.removeAttribute(def.attribute);
			else host.setAttribute(def.attribute, serialized);
		}));
	}
}
