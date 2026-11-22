import { DEV } from '../../../dev/flag.js';
import type { UIElementHooks } from '../../ui-element-hooks.js';
import { warnLateSlotChildren } from './dev/warn-late-slot.js';

// Light-DOM slot content store. A light-DOM component renders into its own host, so the children a
// parent wrote inside it (`<my-card><h1 slot="title">..</h1>body</my-card>`) share a container with
// the component's rendered output. `snapshotLightChildren()` records those children (no DOM
// mutation - components that never use `slot()` are unaffected) just before the first render;
// `slot()` later groups them by `slot` attribute and moves them into place.

const snapshots = new WeakMap<Element, Node[]>();
const grouped = new WeakMap<Element, Map<string, Node[]>>();

/** Called once, before a light-DOM host's first render. No-op if the host has no children. */
export function snapshotLightChildren(host: Element): void {
	if (snapshots.has(host) || !host.firstChild) return;
	snapshots.set(host, Array.from(host.childNodes));
}

/** Nodes the parent assigned to slot `name` (`''` = default slot). Empty if none / not captured. */
export function getSlotContent(host: Element, name = ''): readonly Node[] {
	if (DEV && name) {
		const known = snapshots.get(host);
		if (Array.from(host.children).some(el => el.getAttribute('slot') === name && !known?.includes(el))) {
			warnLateSlotChildren(host, name);
		}
	}
	let map = grouped.get(host);
	if (!map) {
		map = new Map();
		for (const node of snapshots.get(host) ?? []) {
			const key = node instanceof Element ? (node.getAttribute('slot') ?? '') : '';
			let list = map.get(key);
			if (!list) map.set(key, (list = []));
			list.push(node);
		}
		grouped.set(host, map);
	}
	return map.get(name) ?? [];
}

/** Class hook: snapshots a light-DOM host's children on connect (i.e. before its first render). */
export const slotSnapshotHooks: UIElementHooks = {
	beforeConnect(el) {
		if (!el.shadowRoot) snapshotLightChildren(el);
	},
};
