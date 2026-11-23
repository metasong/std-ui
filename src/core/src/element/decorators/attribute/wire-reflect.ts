// Property → attribute: called by `UIElement.connectedCallback()` (`../../ui-element.ts`) to wire
// one effect per reflecting attribute field (`@attribute({ reflect: true })` or
// `defineElement(..., { attributes })`) on a just-connected host, mirroring its store onto the
// host attribute (opt-in; plain store fields never appear here).

import { effect as createEffect } from '../../../reactive/index.js';
import { readSignal } from '../../../util.js';
import type { UIElementHooks } from '../../ui-element-hooks.js';
import { parseAttribute, serializeAttribute } from './converter.js';
import { warnReflectNeedsStore } from './dev/warn-attribute.js';
import { attributeDefs, isSignalLikeForAttribute, resolveInferredConverter } from './metadata.js';

/** The attribute write the reflect effect is performing right now (see its use in `wireReflectedAttributes`). */
let reflecting: { host: HTMLElement; name: string } | null = null;

/**
 * For each `@attribute({ reflect: true })` field recorded on `host`'s constructor, creates an
 * effect that keeps the host attribute in sync with the field's backing signal, and hands the
 * effect's disposer to `registerEffectDisposer` so the caller can dispose it on disconnect.
 */
export function wireReflectedAttributes(host: HTMLElement, registerEffectDisposer: (dispose: () => void) => void): void {
	for (const def of attributeDefs.get(host.constructor)) {
		if (!def.reflect) continue;
		if (!isSignalLikeForAttribute((host as unknown as Record<PropertyKey, unknown>)[def.key])) {
			warnReflectNeedsStore(host, def.key); // a plain field cannot be observed; attribute -> property still works
			continue;
		}
		resolveInferredConverter(host, def);
		let prev: unknown; // previous property value; `undefined` on the first run
		registerEffectDisposer(createEffect(() => {
			// `deep` so any nested change of a state-tree field re-runs the effect.
			const value = readSignal((host as unknown as Record<PropertyKey, () => unknown>)[def.key]);
			const oldValue = prev;
			prev = value;
			const serialized = serializeAttribute(value, oldValue, def.converter);
			if (serialized === undefined) return; // `toAttribute` returning `undefined` means leave untouched
			// The browser runs `attributeChangedCallback` synchronously inside these calls. That echo would parse
			// our own text back into a fresh object (replacing the value just set and notifying subscribers
			// again), so `applyAttribute` ignores it.
			const outer = reflecting;
			reflecting = { host, name: def.attribute };
			try {
				if (serialized === null) host.removeAttribute(def.attribute);
				else host.setAttribute(def.attribute, serialized);
			} finally {
				reflecting = outer;
			}
		}));
	}
}

/** Attribute → property: parses a changed attribute into its field (store `.set()`, or plain assignment). */
function applyAttribute(host: HTMLElement, name: string, oldValue: string | null, newValue: string | null): void {
	if (reflecting?.host === host && reflecting.name === name) return; // echo of our own reflection
	const def = attributeDefs.get(host.constructor).find(def => def.attribute === name);
	if (!def) return;

	resolveInferredConverter(host, def);
	const parsed = parseAttribute(newValue, oldValue, def.converter);
	if (parsed === undefined) return; // a converter's `fromAttribute` returning `undefined` means "leave untouched"
	const record = host as unknown as Record<PropertyKey, unknown>;
	const field = record[def.key];
	if (isSignalLikeForAttribute(field)) field.set(parsed as never);
	else record[def.key] = parsed; // plain field: assigned directly
}

/** Attached to a class by `@attribute` / `defineElement({ attributes })`: both attribute directions. */
export const attributeHooks: UIElementHooks = {
	attributeChanged: applyAttribute,
	connected(el) {
		const disposers: Array<() => void> = [];
		wireReflectedAttributes(el, dispose => void disposers.push(dispose));
		return () => disposers.forEach(dispose => dispose());
	},
};
