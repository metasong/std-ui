// `@queryAssignedNodes()` - read-only accessor over the content a parent projected into one of
// this component's slots (mirrors lit's decorator of the same name; see `./query-assigned.decorator.md`).
//
// - Shadow root: delegates to the native `<slot>.assignedNodes({ flatten })`.
// - Light DOM (default): reads the content captured for the `slot()` directive (see
//   `../../template/directives/slot/`), i.e. the host's original children grouped by `slot` attribute.

import type { UIElement } from '../../ui-element.js';
import { DEV, warnMissingSlotElement } from '../../dev/index.js';
import { getSlotContent } from '../../template/directives/slot/slot-content.js';
import { assertPlainField } from './assert-plain-field.js';

export interface QueryAssignedOptions<T extends Node = Node> {
	/** Slot name; omit (or `''`) for the default slot. */
	slot?: string;
	/** Include nodes of nested slots (shadow DOM only). Default: false. */
	flatten?: boolean;
	/** Keep only elements matching this selector (non-element nodes are dropped). Applied before `filter`. */
	selector?: string;
	/** Custom predicate; keep the node when it returns true. Applied after `selector`. */
	filter?: (node: Node, index: number) => node is T;
}

function assignedNodes(host: UIElement, { slot = '', flatten = false }: QueryAssignedOptions): Node[] {
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
 * the shared read behind `@queryAssignedNodes()` and `this.queryAssignedNodes()`.
 */
export function readAssignedNodes<T extends Node = Node>(host: UIElement, options: QueryAssignedOptions<T> = {}): T[] {
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
 * @queryAssignedNodes({ slot: 'header' }) headerNodes!: Node[];
 * @queryAssignedNodes({ slot: 'tab', selector: 'x-tab' }) tabs!: HTMLElement[];
 * ```
 */
export function queryAssignedNodes<T extends Node = Node>(options: QueryAssignedOptions<T> = {}) {
	return function queryAssignedNodesDecorator(_value: undefined, context: ClassFieldDecoratorContext<UIElement, T[]>): void {
		assertPlainField(context, 'queryAssignedNodes');
		const key = context.name;
		context.addInitializer(function (this: UIElement): void {
			Object.defineProperty(this, key, {
				get: (): T[] => readAssignedNodes(this, options),
				enumerable: true,
				configurable: true,
			});
		});
	};
}
