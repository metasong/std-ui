import { Directive, directive, type DirectivePart, type PartInfo } from '../directive.js';
import { PartType } from '../../parts/part.js';
import type { TemplateResult } from '../../tag-funcs/html/index.js';
import { ChildRenderer, renderWith, TemplateRenderer } from '../../parts/renderers/index.js';
import { DEV, assertSlotDirectiveInLightDom } from '../../../../dev/index.js';
import { getSlotContent } from './slot-content.js';

export { getSlotContent, snapshotLightChildren } from './slot-content.js';

interface SlotValue {
	name: string;
	fallback?: TemplateResult;
}

/** Moves the host's assigned light-DOM nodes in before the anchor (once); renders `fallback`
 *  instead when the slot has no content. Nodes stay in the content store, so a disposed-then-
 *  recreated slot re-inserts them. */
class SlotRenderer extends ChildRenderer<SlotValue> {
	#name: string | undefined;
	#nodes: readonly Node[] = [];
	#fallbackAnchor: Comment | undefined;
	#fallback: TemplateRenderer | undefined;

	update({ name, fallback }: SlotValue): boolean {
		if (this.#name === undefined) {
			this.#name = name;
			if (DEV) assertSlotDirectiveInLightDom(this.host);
			const host = this.host as Element | undefined;
			this.#nodes = host ? getSlotContent(host, name) : [];
			for (const node of this.#nodes) this.anchor.before(node);
		} else if (this.#name !== name) return false;

		if (this.#nodes.length === 0 && fallback) {
			if (!this.#fallback) {
				this.#fallbackAnchor = document.createComment('');
				this.anchor.before(this.#fallbackAnchor);
				this.#fallback = new TemplateRenderer(this.#fallbackAnchor, this.host);
			}
			if (!this.#fallback.update(fallback)) {
				this.#fallback.dispose();
				this.#fallback = new TemplateRenderer(this.#fallbackAnchor!, this.host);
				this.#fallback.update(fallback);
			}
		}
		return true;
	}

	override disconnect(): void {
		this.#fallback?.disconnect();
	}

	dispose(): void {
		this.#fallback?.dispose();
		this.#fallbackAnchor?.remove();
		for (const node of this.#nodes) node.parentNode?.removeChild(node);
	}
}

class SlotDirective extends Directive {
	constructor(partInfo: PartInfo) {
		super(partInfo);
		if (partInfo.type !== PartType.CHILD) {
			throw new Error('std-ui slot(): must be bound to a child position, not an attribute.');
		}
	}

	override update(_part: DirectivePart, name: string = '', fallback?: TemplateResult) {
		return renderWith(SlotRenderer, { name, fallback });
	}
}

/**
 * Light-DOM slot: projects the children a parent placed inside this component (matched by their
 * `slot="name"` attribute; no `slot` attribute = default slot) at this position. Shadow-DOM
 * components should use a native `<slot>` instead.
 *
 *   t`<header>${slot('title')}</header><main>${slot()}</main>`
 *   t`${slot('footer', t`<small>default footer</small>`)}`   // fallback when empty
 *
 * Children are snapshotted when the component first connects, so they must already exist then
 * (true for script-created elements and for upgrades of already-parsed markup; not for an
 * element defined while the parser is still mid-way through its children).
 */
export const slot = directive(SlotDirective);
