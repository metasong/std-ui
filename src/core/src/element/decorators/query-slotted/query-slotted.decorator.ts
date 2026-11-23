// `@querySlotted()` - read-only accessor over the content a parent projected into one of
// this component's slots (see `./README.md`).
//
// - Shadow root: delegates to the native `<slot>.assignedNodes({ flatten })`.
// - Light DOM (default): reads the content captured for the `slot()` directive (see
//   `./slot-content.ts`), i.e. the host's original children grouped by `slot` attribute.

import type { UIElement } from '../../ui-element.js';
import { addClassHooks } from '../../ui-element-hooks.js';
import { DEV } from '../../../dev/flag.js';
import { warnMissingSlotElement } from './dev/warn-missing-slot.js';
import { getSlotContent, slotSnapshotHooks } from './slot-content.js';


export interface QuerySlottedOptions<T extends Node = Node> {
	/** Slot name; omit (or `''`) for the default slot. */
	slot?: string;
	/** Include nodes of nested slots (shadow DOM only). Default: false. */
	flatten?: boolean;
	/** Keep only elements matching this selector (non-element nodes are dropped). Applied before `filter`. */
	selector?: string;
	/** Custom predicate; keep the node when it returns true. Applied after `selector`. */
	filter?: (node: Node, index: number) => node is T;
}

function assignedNodes(host: UIElement, { slot = '', flatten = false }: QuerySlottedOptions): Node[] {
	const root = host.renderRoot;
	if (root instanceof ShadowRoot) {
		const el = root.querySelector<HTMLSlotElement>(slot ? `slot[name="${CSS.escape(slot)}"]` : 'slot:not([name])');
		if (!el && DEV) warnMissingSlotElement(host, slot);
		return el ? el.assignedNodes({ flatten }) : [];
	}
	return [...getSlotContent(host, slot)]; // light DOM: content captured for `slot()`
}

/**
 * Nodes currently assigned to a slot of `host`, optionally narrowed by `selector` and/or `filter` -
 * the shared read behind `@querySlotted()` and `this.querySlotted()`.
 */
export function querySlottedNodes<T extends Node = Node>(host: UIElement, options: QuerySlottedOptions<T> = {}): T[] {
	const { selector, filter } = options;
	let nodes = assignedNodes(host, options);
	if (selector) nodes = nodes.filter(n => n instanceof Element && n.matches(selector));
	if (filter) nodes = nodes.filter(filter);
	return nodes as T[];
}

/**
 * Read-only field: nodes assigned to a slot, re-read on every access, optionally narrowed by
 * `selector` and/or `filter`.
 *
 * ```ts
 * @querySlotted({ slot: 'header' }) headerNodes!: Node[];
 * @querySlotted({ slot: 'tab', selector: 'x-tab' }) tabs!: HTMLElement[];
 * ```
 */
export function querySlotted<T extends Node = Node>(options: QuerySlottedOptions<T> = {}) {
	return function querySlottedDecorator(_value: undefined, context: ClassFieldDecoratorContext<UIElement, T[]>): void {
		if (context.kind !== 'field') throw new Error(DEV ? '@querySlotted() can only decorate a plain class field (no accessor).' : 'querySlotted: plain fields only');
		const key = context.name;
		addClassHooks(context.metadata as object, slotSnapshotHooks); // capture the host's children before its first render (once per class)
		context.addInitializer(function (this: UIElement): void {
			Object.defineProperty(this, key, {
				get: (): T[] => querySlottedNodes(this, options),
				enumerable: true,
				configurable: true,
			});
		});
	};
}
