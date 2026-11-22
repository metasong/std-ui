import type { SlotDescriptor } from './types.js';

/** Walks `root` in document order, assigning each descriptor's `nodeIndex` and stripping placeholders.
 *
 *  `nodeIndex` is the index of the placeholder's node among all elements/comments in the parsed markup
 *  (text nodes are not counted). */
export function resolveIndices(root: DocumentFragment, descriptors: SlotDescriptor[], marker: string): void {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
	let descriptorIndex = 0;
	let nodeIndex = 0;
	let node: Node | null;

	while ((node = walker.nextNode())) {
		if (node.nodeType === Node.COMMENT_NODE && node.textContent === marker) {
			descriptors[descriptorIndex++].nodeIndex = nodeIndex;
		}
		else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as Element;
			// Snapshot names: removing while iterating live `el.attributes` would skip entries.
			for (const attrName of Array.from(el.attributes).map(a => a.name)) {
				if (el.getAttribute(attrName) === marker) {
					descriptors[descriptorIndex++].nodeIndex = nodeIndex;
					el.removeAttribute(attrName);
				}
			}
		}
		nodeIndex++;
	}
}
