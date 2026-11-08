// --- Compilation: `strings` -> parsed <template> + where its dynamic parts are. -------------------
//
// See `html.ts` for the overall design. This module turns a tagged-template's `strings` array into
// a cached, parsed `<template>` plus a list of `PartDescriptor`s recording where each dynamic value
// landed, and `instantiate()` later clones that template and resolves those descriptors to real
// nodes for a fresh render.

/** Marks a child-content position; kept as a real comment node in the DOM to anchor updates. */
const CHILD_MARKER = 'std-ui-part';
const CHILD_MARKER_COMMENT = `<!--${CHILD_MARKER}-->`;
/** Marks an attribute-value position. The *parsed* attribute value is just this placeholder - it's
 *  discarded and recomputed from `PartDescriptor.literals`/live values on first `update()`, so one
 *  marker suffices whether the attribute binds one interpolation or several (see `OpenAttr` below). */
const ATTR_MARKER = 'std-ui-part';

export type PartKind = 'child' | 'attr' | 'bool' | 'prop' | 'event';

export interface PartDescriptor {
	kind: PartKind;
	/** Attribute/property/event name, sans its `.`/`?`/`@` sigil and any `.modifier`s. Unused for `kind: 'child'`. */
	name: string;
	/** Position of this part's node among all element/comment nodes in document order; filled in by `walk()`. */
	nodeIndex: number;
	/** `kind: 'event'` only: parsed from `.capture`/`.once`/`.passive` modifiers, e.g. `@click.once.capture="${h}"`. */
	options?: AddEventListenerOptions;
	/** `kind: 'attr'` only: the static text segments surrounding each interpolation in this
	 *  attribute's value, e.g. `class="a-${x}-b-${y}"` -> `['a-', '-b-', '']`. Always has exactly
	 *  `valueCount + 1` entries; `['', '']` for a bare `attr="${value}"` with no static text. */
	literals?: string[];
	/** Number of consecutive entries of the tagged-template's `values[]` this descriptor consumes,
	 *  in source order. `1` for every kind except `attr`, which is `>= 1` - an attribute's value may
	 *  mix static text with any number of interpolations, e.g. `class="${a} ${b}"`. */
	valueCount: number;
}

export interface Template {
	element: HTMLTemplateElement;
	parts: PartDescriptor[];
}

/** `'svg'` wraps the compiled markup in a temporary `<svg>` during parsing so elements land in the
 *  SVG namespace (needed when the markup has no `<svg>` of its own, e.g. a `<circle>` meant to be
 *  interpolated as a child of an existing `<svg>`). See `html.ts`'s `svg()`. */
export type TemplateType = 'html' | 'svg';

/** Keyed by `strings` then by `type`, since the same `strings` identity is never reused across
 *  `html`/`svg` call sites in practice, but this keeps the cache correct either way. */
const templateCache = new WeakMap<TemplateStringsArray, Partial<Record<TemplateType, Template>>>();

/** True if `markup` (built so far) currently sits inside an unclosed tag, i.e. in attribute position. */
function isInsideTag(markup: string): boolean {
	return markup.lastIndexOf('<') > markup.lastIndexOf('>');
}

const EVENT_MODIFIERS = ['capture', 'once', 'passive'] as const;
type EventModifier = (typeof EVENT_MODIFIERS)[number];

/** Matches `name="prefix` (optionally `.name=`/`?name=`/`@name=`, or `@name.mod1.mod2=`) right at the
 *  end of `markup`, where `prefix` is whatever static text already sits between the opening quote and
 *  the first interpolation (e.g. the `static-` in `class="static-${x}"`). The backreference to the
 *  quote group ensures `prefix` doesn't itself contain an unescaped copy of that same quote (which
 *  would mean the attribute already closed before reaching here). */
const ATTR_START_RE = /([.?@]?)([\w-]+(?:\.[\w-]+)*)\s*=\s*(["'])((?:(?!\3).)*)$/;

/** An attribute value currently being accumulated across one or more `${...}` interpolations,
 *  between the opening quote (first matched by `ATTR_START_RE`) and the matching closing quote. */
interface OpenAttr {
	kind: PartKind;
	name: string;
	options?: AddEventListenerOptions;
	quote: string;
	/** Static segments seen so far; always one longer than the number of values consumed. */
	literals: string[];
	valueCount: number;
}

// `compile()` is a tiny finite-state scanner over `strings`/the interpolations between them - the
// same technique a real HTML tokenizer uses (the WHATWG spec's "data state" vs. "attribute value
// state", etc.): an explicit, named state plus a transition function per state, so each state only
// has to reason about its own concerns. Two states suffice here:
//
//   TEXT      - markup, between tags: the next `${...}` is a `ChildPart` or starts a new attribute.
//   ATTR_VALUE - inside an unclosed, quoted attribute value: the next `${...}` extends the *same*
//                attribute binding (letting `class="${a} ${b}"` span any number of interpolations).
//
// `TEXT -> ATTR_VALUE` happens on seeing `name="`; `ATTR_VALUE -> TEXT` happens on seeing the
// matching closing quote (immediately followed by a fresh `TEXT -> ATTR_VALUE` transition if more
// of the tag follows, e.g. a second attribute).
type ScanState =
	| { readonly kind: 'TEXT' }
	| { readonly kind: 'ATTR_VALUE'; readonly attr: OpenAttr };

const TEXT: ScanState = { kind: 'TEXT' };

function parseEventModifiers(raw: string): { name: string; options: AddEventListenerOptions } {
	const [name, ...modifiers] = raw.split('.');
	const options: AddEventListenerOptions = {};
	for (const mod of modifiers) {
		if ((EVENT_MODIFIERS as readonly string[]).includes(mod)) options[mod as EventModifier] = true;
	}
	return { name, options };
}

/** Starts tracking a new attribute-value binding right after its opening quote was just appended
 *  to `markup` (ending with the match from `ATTR_START_RE`). */
function openAttr(markup: string): OpenAttr {
	const match = ATTR_START_RE.exec(markup);
	if (!match) {
		throw new Error(`std-ui html: could not parse an attribute binding near "...${markup.slice(-40)}"`);
	}
	const [, sigil, raw, quote, prefix] = match;
	const kind: PartKind = sigil === '.' ? 'prop' : sigil === '?' ? 'bool' : sigil === '@' ? 'event' : 'attr';
	if (kind === 'event') {
		const { name, options } = parseEventModifiers(raw);
		return { kind, name, options, quote, literals: [prefix], valueCount: 1 };
	}
	return { kind, name: raw, quote, literals: [prefix], valueCount: 1 };
}

/** Finalizes an `OpenAttr` (its closing quote has just been found) into a `PartDescriptor`. */
function closeAttr(open: OpenAttr): PartDescriptor {
	if (open.kind !== 'attr') {
		const sigil = open.kind === 'bool' ? '?' : open.kind === 'prop' ? '.' : '@';
		const hasStaticText = open.literals.some(s => s !== '');
		if (open.valueCount !== 1 || hasStaticText) {
			throw new Error(
				`std-ui html: "${sigil}${open.name}" must bind exactly one interpolation with no static ` +
					`text, e.g. ${sigil}${open.name}="\${value}" - only plain attributes (no sigil) support ` +
					`multiple/mixed interpolations like class="\${a} \${b}".`,
			);
		}
	}
	return {
		kind: open.kind,
		name: open.name,
		options: open.options,
		nodeIndex: -1,
		literals: open.kind === 'attr' ? open.literals : undefined,
		valueCount: open.valueCount,
	};
}

/** `ATTR_VALUE`'s transition: consumes one interpolation's preceding `chunk`. Returns the next
 *  state plus whatever should be appended to `markup` for this step (nothing, until the attribute's
 *  closing quote is actually found - see the `ATTR_MARKER` comment above). */
function stepAttrValue(
	attr: OpenAttr,
	chunk: string,
	descriptors: PartDescriptor[],
): { state: ScanState; append: string } {
	const quoteIndex = chunk.indexOf(attr.quote);
	if (quoteIndex === -1) {
		// Still inside the attribute's value: this chunk and the interpolation after it both extend
		// the same binding, e.g. the ` ` between `${a}` and `${b}` in `class="${a} ${b}"`.
		attr.literals.push(chunk);
		attr.valueCount++;
		return { state: { kind: 'ATTR_VALUE', attr }, append: '' };
	}
	// The closing quote lives partway through this chunk: finalize the binding, then resume
	// scanning `TEXT` from right after it (chunk.slice(quoteIndex) includes the quote itself).
	attr.literals.push(chunk.slice(0, quoteIndex));
	descriptors.push(closeAttr(attr));
	return { state: TEXT, append: ATTR_MARKER + chunk.slice(quoteIndex) };
}

/** `TEXT`'s transition: decides what the *next* interpolation binds to, given `markup` built so far.
 *  `rewind` tells the caller how many trailing characters of `markup` to drop - used when opening an
 *  attribute whose value already has static text before its first interpolation (e.g. the `static-`
 *  in `class="static-${x}"`): that text got written into `markup` as ordinary text already, but it's
 *  also captured in `attr.literals[0]` to be recomposed at render time, so the copy in `markup` would
 *  otherwise end up duplicated alongside the `ATTR_MARKER` placeholder. */
function stepText(markup: string, descriptors: PartDescriptor[]): { state: ScanState; append: string; rewind: number } {
	if (isInsideTag(markup)) {
		const attr = openAttr(markup);
		return { state: { kind: 'ATTR_VALUE', attr }, append: '', rewind: attr.literals[0].length };
	}
	descriptors.push({ kind: 'child', name: '', nodeIndex: -1, valueCount: 1 });
	return { state: TEXT, append: CHILD_MARKER_COMMENT, rewind: 0 };
}

function compile(strings: TemplateStringsArray, type: TemplateType): Template {
	let markup = '';
	const descriptors: PartDescriptor[] = [];
	let state: ScanState = TEXT;

	for (let i = 0; i < strings.length - 1; i++) {
		const chunk = strings[i];

		if (state.kind === 'ATTR_VALUE') {
			const step = stepAttrValue(state.attr, chunk, descriptors);
			state = step.state;
			markup += step.append;
			// If the attribute's value is still open, this interpolation extended it - nothing more
			// to decide for it. Otherwise (closing quote found mid-chunk) the attribute is done, but
			// *this* interpolation wasn't part of it; fall through to `stepText` to decide it fresh,
			// e.g. the `${c}` in `class="${a} ${b}">${c}<` right after `class`'s closing quote.
			if (state.kind === 'ATTR_VALUE') continue;
		}
		else {
			markup += chunk;
		}

		const step = stepText(markup, descriptors);
		state = step.state;
		markup = markup.slice(0, markup.length - step.rewind) + step.append;
	}

	const lastChunk = strings[strings.length - 1];
	if (state.kind === 'ATTR_VALUE') {
		const quoteIndex = lastChunk.indexOf(state.attr.quote);
		if (quoteIndex === -1) {
			throw new Error(`std-ui html: unterminated attribute value near "...${lastChunk.slice(-40)}"`);
		}
		state.attr.literals.push(lastChunk.slice(0, quoteIndex));
		descriptors.push(closeAttr(state.attr));
		markup += ATTR_MARKER + lastChunk.slice(quoteIndex);
	}
	else {
		markup += lastChunk;
	}

	const element = document.createElement('template');
	if (type === 'svg') {
		// Parse inside a temporary `<svg>` so the HTML parser assigns the SVG namespace to the
		// markup's elements, then hoist the `<svg>`'s children back up to `element.content` so
		// node indices line up exactly like the `'html'` path (no wrapper left behind).
		element.innerHTML = `<svg>${markup}</svg>`;
		const wrapper = element.content.firstChild as SVGElement;
		while (wrapper.firstChild) element.content.appendChild(wrapper.firstChild);
		wrapper.remove();
	}
	else {
		element.innerHTML = markup;
	}
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

export function getTemplate(strings: TemplateStringsArray, type: TemplateType = 'html'): Template {
	let byType = templateCache.get(strings);
	if (!byType) {
		byType = {};
		templateCache.set(strings, byType);
	}
	let template = byType[type];
	if (!template) {
		template = compile(strings, type);
		byType[type] = template;
	}
	return template;
}

/** Clones `template`'s content and creates a fresh `Part` per recorded descriptor, bound to the clone. */
export function instantiate(template: Template): { fragment: DocumentFragment; parts: import('./parts/index.js').Part[] } {
	const fragment = template.element.content.cloneNode(true) as DocumentFragment;

	const nodesByIndex: Node[] = [];
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
	let node: Node | null;
	let i = 0;
	while ((node = walker.nextNode())) nodesByIndex[i++] = node;

	const parts = template.parts.map((descriptor): import('./parts/index.js').Part => {
		const target = nodesByIndex[descriptor.nodeIndex];
		return createPart(descriptor, target);
	});

	return { fragment, parts };
}

// Deferred import kept local to avoid a circular top-level import cycle between `compile.ts` and
// `parts/` (parts only need `instantiate` for nested templates inside `ChildPart`).
import { AttributePart, BooleanAttributePart, EventPart, PropertyPart, ChildPart } from './parts/index.js';

function createPart(descriptor: PartDescriptor, target: Node): import('./parts/index.js').Part {
	switch (descriptor.kind) {
		case 'child': return new ChildPart(target as Comment);
		case 'attr': return new AttributePart(target as Element, descriptor.name, descriptor.literals);
		case 'bool': return new BooleanAttributePart(target as Element, descriptor.name);
		case 'prop': return new PropertyPart(target as Element, descriptor.name);
		case 'event': return new EventPart(target as Element, descriptor.name, descriptor.options);
	}
}
