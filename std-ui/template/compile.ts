// --- Compilation: `strings` -> parsed <template> + where its dynamic parts are. -------------------
//
// See `html.ts` for the overall design. This module turns a tagged-template's `strings` array into
// a cached, parsed `<template>` plus a list of `PartDescriptor`s recording where each dynamic value
// landed, and `instantiate()` later clones that template and resolves those descriptors to real
// nodes for a fresh render.

/** Marks a child-content position; kept as a real comment node in the DOM to anchor updates. */
const CHILD_MARKER = 'mini-ui-part';
const CHILD_MARKER_COMMENT = `<!--${CHILD_MARKER}-->`;
/** Marks an attribute-value position; always the *entire* attribute value (no interpolation mixing). */
const ATTR_MARKER = 'mini-ui-part';

export type PartKind = 'child' | 'attr' | 'bool' | 'prop' | 'event';

export interface PartDescriptor {
	kind: PartKind;
	/** Attribute/property/event name, sans its `.`/`?`/`@` sigil. Unused for `kind: 'child'`. */
	name: string;
	/** Position of this part's node among all element/comment nodes in document order; filled in by `walk()`. */
	nodeIndex: number;
}

export interface Template {
	element: HTMLTemplateElement;
	parts: PartDescriptor[];
}

const templateCache = new WeakMap<TemplateStringsArray, Template>();

/** True if `markup` (built so far) currently sits inside an unclosed tag, i.e. in attribute position. */
function isInsideTag(markup: string): boolean {
	return markup.lastIndexOf('<') > markup.lastIndexOf('>');
}

/** Reads the `name="` (optionally `.name=`/`?name=`/`@name=`) immediately before the cursor in `markup`. */
function readAttrName(markup: string): { kind: PartKind; name: string } {
	const match = /([.?@]?)([\w-]+)\s*=\s*["']?$/.exec(markup);
	const sigil = match?.[1] ?? '';
	const name = match?.[2] ?? '';
	const kind: PartKind = sigil === '.' ? 'prop' : sigil === '?' ? 'bool' : sigil === '@' ? 'event' : 'attr';
	return { kind, name };
}

function compile(strings: TemplateStringsArray): Template {
	let markup = '';
	const descriptors: PartDescriptor[] = [];

	for (let i = 0; i < strings.length - 1; i++) {
		markup += strings[i];
		if (isInsideTag(markup)) {
			descriptors.push({ ...readAttrName(markup), nodeIndex: -1 });
			markup += ATTR_MARKER;
		}
		else {
			descriptors.push({ kind: 'child', name: '', nodeIndex: -1 });
			markup += CHILD_MARKER_COMMENT;
		}
	}
	markup += strings[strings.length - 1];

	const element = document.createElement('template');
	element.innerHTML = markup;
	resolvePartIndices(element.content, descriptors);

	return { element, parts: descriptors };
}

/** Walks `root` in document order, filling in each descriptor's `nodeIndex` and stripping marker attributes. */
function resolvePartIndices(root: DocumentFragment, descriptors: PartDescriptor[]): void {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
	let descriptorIndex = 0;
	let nodeIndex = 0;
	let node: Node | null;

	while ((node = walker.nextNode())) {
		if (node.nodeType === Node.COMMENT_NODE && node.textContent === CHILD_MARKER) {
			descriptors[descriptorIndex++].nodeIndex = nodeIndex;
		}
		else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as Element;
			// Snapshot names first: `removeAttribute` while iterating `el.attributes` live would skip entries.
			for (const attrName of Array.from(el.attributes).map(a => a.name)) {
				if (el.getAttribute(attrName) === ATTR_MARKER) {
					descriptors[descriptorIndex++].nodeIndex = nodeIndex;
					el.removeAttribute(attrName);
				}
			}
		}
		nodeIndex++;
	}
}

export function getTemplate(strings: TemplateStringsArray): Template {
	let template = templateCache.get(strings);
	if (!template) {
		template = compile(strings);
		templateCache.set(strings, template);
	}
	return template;
}

/** Clones `template`'s content and creates a fresh `Part` per recorded descriptor, bound to the clone. */
export function instantiate(template: Template): { fragment: DocumentFragment; parts: import('./parts.js').Part[] } {
	const fragment = template.element.content.cloneNode(true) as DocumentFragment;

	const nodesByIndex: Node[] = [];
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
	let node: Node | null;
	let i = 0;
	while ((node = walker.nextNode())) nodesByIndex[i++] = node;

	const parts = template.parts.map((descriptor): import('./parts.js').Part => {
		const target = nodesByIndex[descriptor.nodeIndex];
		return createPart(descriptor, target);
	});

	return { fragment, parts };
}

// Deferred import kept local to avoid a circular top-level import cycle between `compile.ts` and
// `parts.ts` (parts only need `instantiate` for nested templates inside `ChildPart`).
import { AttributePart, BooleanAttributePart, EventPart, PropertyPart, ChildPart } from './parts.js';

function createPart(descriptor: PartDescriptor, target: Node): import('./parts.js').Part {
	switch (descriptor.kind) {
		case 'child': return new ChildPart(target as Comment);
		case 'attr': return new AttributePart(target as Element, descriptor.name);
		case 'bool': return new BooleanAttributePart(target as Element, descriptor.name);
		case 'prop': return new PropertyPart(target as Element, descriptor.name);
		case 'event': return new EventPart(target as Element, descriptor.name);
	}
}
