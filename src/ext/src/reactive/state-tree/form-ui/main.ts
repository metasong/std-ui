// Form UI state for tree nodes, kept separate from the state core like `check` / `changes`:
// `formUi(stateTree(...))` (or `stateTree(...).with(formUi)`) adds `touched`, `readonly` and `disabled` to
// every node under `node.formUi`, including members added later. The state only *holds* them;
// `formBind` (see `../../../element/template/directives/form-bind`) shows them on the element.
//
// `readonly` / `disabled` cascade: a node is effectively readonly / disabled when it or any
// ancestor is (`readonly()` / `disabled()`; set one with `.own.set()`). `touched()` goes the other
// way: it is true when the node or any descendant is touched (`touched.own` is the node's own flag,
// `touchAll()` marks a whole subtree, e.g. on submit).

import type { WithFeature } from '../tree-feature.js';
import { computed, state, type Computed, type State } from '@std-ui/core';
import { childEntries, extendTree, type TreeNode } from '../node.js';
import { type StateArray } from '../array/index.js';
import { type StateObject } from '../object/index.js';

/**
 * A flag with a resolved read and an own write: `flag()` is tracked and combines this node's own flag
 * with the related nodes' (ancestors for `readonly` / `disabled`, descendants for `touched`);
 * `flag.own` is this node's writable flag.
 */
export type Flag = Computed<boolean> & { readonly own: State<boolean> };

/** Form UI members, grouped under `node.formUi`. */
export interface FormUi {
	/**
	 * Tracked; this node or any descendant is touched: the user left the control (or validation was
	 * reported). Drives error display. Write this node's own flag with `touched.own.set()`.
	 */
	readonly touched: Flag;
	/** Tracked; readonly on this node or any ancestor. Write this node's own flag with `readonly.own.set()`. */
	readonly readonly: Flag;
	/** Tracked; disabled on this node or any ancestor. Write this node's own flag with `disabled.own.set()`. */
	readonly disabled: Flag;
	/** Marks this node's own flag touched. */
	touch(): void;
	/** Clears this node's own flag (a touched descendant still makes `touched()` true). */
	untouch(): void;
	/** Marks this node and every descendant touched. */
	touchAll(): void;
	/** Marks this node and every descendant untouched. */
	untouchAll(): void;
}

/** Mixin added to every node by `formUi()`. */
export interface WithFormUiMixin {
	readonly formUi: FormUi;
}

declare module '../tree-feature.js' {
	interface TreeFeatures<T> {
		formUi: WithFormUiMixin;
	}
}

/** A state tree `S` after `formUi()`: the same tree, with `formUi` on every node. */
export type WithFormUi<S> = WithFeature<S, 'formUi'>;

// Parent links, for the cascade. A node adopted into several trees has several parents, and is
// effectively readonly / disabled when any of them is. Filled when a node is extended (for its
// current members) and rebuilt from the roots when a node with no known parent is read (members
// added later); the rebuild also drops links to members that have since been removed.
let parents = new WeakMap<object, Set<object>>();
const roots: WeakRef<object>[] = [];

function link(node: object): void {
	for (const [, child] of childEntries(node)) {
		if (typeof child !== 'object' && typeof child !== 'function') continue;
		if (child === null) continue;
		let set = parents.get(child as object);
		if (!set) parents.set(child as object, (set = new Set()));
		set.add(node);
		link(child as object);
	}
}

function parentsOf(node: object): readonly { formUi: FormUi }[] {
	let found = parents.get(node);
	if (!found && !roots.some((r) => r.deref() === node)) {
		parents = new WeakMap();
		for (const root of roots) {
			const target = root.deref();
			if (target) link(target);
		}
		found = parents.get(node);
	}
	return found ? ([...found] as unknown as readonly { formUi: FormUi }[]) : [];
}
function eachChild(node: object, fn: (ui: FormUi) => void): void {
	for (const [, child] of childEntries(node)) {
		const ui = (child as { formUi?: FormUi } | undefined)?.formUi;
		if (ui) fn(ui);
	}
}

/**
 * Adds form UI state to a state tree: `formUi(stateTree({ name: '' })).name.formUi.touched()`, or
 * chained: `stateTree(...).with(check).with(formUi)`. Returns the same tree (not a copy). Members
 * added later get `formUi` too. Safe to apply twice.
 */
export function formUi<S extends TreeNode>(node: S): WithFormUi<S> {
	if (!roots.some((r) => r.deref() === node)) roots.push(new WeakRef(node));
	extendTree(node, attach);
	link(node);
	return node as unknown as WithFormUi<S>;
}

function attach(node: object): void {
	const n = node as TreeNode & { shallow?: () => unknown };
	const flag = (resolve: (own: boolean) => boolean): Flag => {
		const own = state(false);
		return Object.assign(computed(() => resolve(own.get())), { own });
	};
	// readonly / disabled: own OR any ancestor.
	const fromAncestors = (pick: (ui: FormUi) => Flag) => (own: boolean) =>
		own || parentsOf(n).some((p) => pick(p.formUi).get());
	const readonly = flag(fromAncestors((ui) => ui.readonly));
	const disabled = flag(fromAncestors((ui) => ui.disabled));
	// touched: own OR any descendant.
	const touched = flag((own) => {
		if (own) return true;
		n.shallow?.(); // tracked: which members exist
		let any = false;
		eachChild(n, (ui) => {
			if (!any && ui.touched.get()) any = true;
		});
		return any;
	});
	const ui: FormUi = {
		touched,
		readonly,
		disabled,
		touch: () => touched.own.set(true),
		untouch: () => touched.own.set(false),
		touchAll() {
			touched.own.set(true);
			eachChild(n, (c) => c.touchAll());
		},
		untouchAll() {
			touched.own.set(false);
			eachChild(n, (c) => c.untouchAll());
		},
	};
	Object.defineProperty(n, 'formUi', { value: ui });
}
