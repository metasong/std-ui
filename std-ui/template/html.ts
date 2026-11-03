// A tiny, app-agnostic subset of lit-html's design: tagged-template HTML with fine-grained,
// in-place DOM updates - no vdom diffing, no full re-parse/re-render per update.
//
// Usage mirrors lit-html:
//
//   const result = html`<div class="${cls}">${label}</div>`;
//   render(result, container);
//
// How it works (same core trick as lit-html):
//  1. `html` just captures `strings`/`values` - no DOM work happens yet. Tagged template calls
//     reuse the *same* `strings` array object across repeated calls at the same call site (this is
//     guaranteed by the JS spec), so it doubles as a cache key.
//  2. The first time a given `strings` array is rendered, we compile it once: join the strings with
//     marker text, parse via a `<template>`, then walk the parsed tree to record where each dynamic
//     part landed (as a node index in document order, since `TreeWalker` visits nodes in the same
//     left-to-right order they were written in the markup). This compiled `Template` is cached
//     forever in a `WeakMap` keyed by `strings`.
//  3. Each render of a given container clones the compiled template's content once (cheap native
//     `cloneNode`), re-walks the clone with the same traversal to resolve the recorded indices back
//     to real nodes, and creates a `Part` (child/attribute/property/event/boolean-attribute) per
//     dynamic position.
//  4. On every subsequent render with the *same* `strings`, we skip steps 2-3 entirely and just call
//     `.update(value)` on each already-bound `Part` - only the values that actually changed touch
//     the DOM (`Part`s no-op on `Object.is`-equal values).
//
// What's intentionally left out, vs. real lit-html: keyed list reconciliation (`repeat()`),
// directives, SVG/MathML template handling, and multi-expression attributes (`class="${a} ${b}"`).
// Bindings must be single interpolations like `attr="${value}"`.

/** The result of calling `html` - inert until passed to `render()`. */
export interface TemplateResult {
	readonly strings: TemplateStringsArray;
	readonly values: readonly unknown[];
}

/** Tags a template literal as HTML to be rendered via `render()`. Does no DOM work itself. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return { strings, values };
}

function isTemplateResult(value: unknown): value is TemplateResult {
	return typeof value === 'object' && value !== null && 'strings' in value && 'values' in value;
}

const unsafeHtmlTag = Symbol('unsafeHtml');

/** Wrapper produced by `unsafeHTML()`; recognized by `ChildPart` as markup to parse, not escape. */
interface UnsafeHtml {
	readonly markup: string;
	readonly [unsafeHtmlTag]: true;
}

function isUnsafeHtml(value: unknown): value is UnsafeHtml {
	return typeof value === 'object' && value !== null && unsafeHtmlTag in value;
}

/**
 * Escape hatch (mirrors lit-html's `unsafeHTML` directive) for injecting markup that's already
 * HTML - e.g. an SVG icon loaded via `?raw` - as a child binding, bypassing the normal
 * text-node-only handling. Caller is responsible for the markup being trusted/sanitized; this
 * does no escaping.
 *
 *   html`<button>${unsafeHTML(iconSvg)}</button>`
 */
export function unsafeHTML(markup: string): UnsafeHtml {
	return { markup, [unsafeHtmlTag]: true } as UnsafeHtml;
}

// --- Compilation: `strings` -> parsed <template> + where its dynamic parts are. -------------------

/** Marks a child-content position; kept as a real comment node in the DOM to anchor updates. */
const CHILD_MARKER = 'mini-ui-part';
const CHILD_MARKER_COMMENT = `<!--${CHILD_MARKER}-->`;
/** Marks an attribute-value position; always the *entire* attribute value (no interpolation mixing). */
const ATTR_MARKER = 'mini-ui-part';

type PartKind = 'child' | 'attr' | 'bool' | 'prop' | 'event';

interface PartDescriptor {
	kind: PartKind;
	/** Attribute/property/event name, sans its `.`/`?`/`@` sigil. Unused for `kind: 'child'`. */
	name: string;
	/** Position of this part's node among all element/comment nodes in document order; filled in by `walk()`. */
	nodeIndex: number;
}

interface Template {
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

function getTemplate(strings: TemplateStringsArray): Template {
	let template = templateCache.get(strings);
	if (!template) {
		template = compile(strings);
		templateCache.set(strings, template);
	}
	return template;
}

// --- Parts: bind one dynamic position to a live DOM location. -------------------------------------

interface Part {
	update(value: unknown): void;
}

class AttributePart implements Part {
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		if (value == null) this.el.removeAttribute(this.name);
		else this.el.setAttribute(this.name, String(value));
	}
}

class BooleanAttributePart implements Part {
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		this.el.toggleAttribute(this.name, Boolean(value));
	}
}

class PropertyPart implements Part {
	#value: unknown;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (Object.is(value, this.#value)) return;
		this.#value = value;
		(this.el as unknown as Record<string, unknown>)[this.name] = value;
	}
}

class EventPart implements Part {
	#listener: EventListenerOrEventListenerObject | undefined;
	constructor(private readonly el: Element, private readonly name: string) {}
	update(value: unknown): void {
		if (value === this.#listener) return;
		if (this.#listener) this.el.removeEventListener(this.name, this.#listener);
		this.#listener = typeof value === 'function' ? (value as EventListener) : undefined;
		if (this.#listener) this.el.addEventListener(this.name, this.#listener);
	}
}

/** Everything a `ChildPart` may currently hold, so it knows how to diff the next value against it. */
type ChildCommit =
	| { kind: 'none' }
	| { kind: 'text'; node: Text }
	| { kind: 'template'; strings: TemplateStringsArray; parts: Part[]; nodes: ChildNode[] }
	| { kind: 'unsafeHtml'; markup: string; nodes: ChildNode[] }
	| { kind: 'list'; items: ChildPart[] };

/** Binds a child-content position, anchored by a persistent comment node (`anchor`) in the DOM. */
class ChildPart implements Part {
	#committed: ChildCommit = { kind: 'none' };
	constructor(private readonly anchor: Comment) {}

	update(value: unknown): void {
		if (Array.isArray(value)) this.#commitList(value);
		else if (isTemplateResult(value)) this.#commitTemplate(value);
		else if (isUnsafeHtml(value)) this.#commitUnsafeHtml(value.markup);
		else if (value == null || value === false) this.#clear();
		else this.#commitText(String(value));
	}

	#clear(): void {
		if (this.#committed.kind === 'text') this.#committed.node.remove();
		else if (this.#committed.kind === 'template') for (const n of this.#committed.nodes) n.remove();
		else if (this.#committed.kind === 'unsafeHtml') for (const n of this.#committed.nodes) n.remove();
		else if (this.#committed.kind === 'list') {
			for (const part of this.#committed.items) {
				part.#clear();
				part.anchor.remove();
			}
		}
		this.#committed = { kind: 'none' };
	}

	#commitText(text: string): void {
		if (this.#committed.kind === 'text') {
			if (this.#committed.node.data !== text) this.#committed.node.data = text;
			return;
		}
		this.#clear();
		const node = document.createTextNode(text);
		this.anchor.before(node);
		this.#committed = { kind: 'text', node };
	}

	#commitUnsafeHtml(markup: string): void {
		if (this.#committed.kind === 'unsafeHtml' && this.#committed.markup === markup) return;
		this.#clear();
		const container = document.createElement('template');
		container.innerHTML = markup;
		const nodes = Array.from(container.content.childNodes);
		this.anchor.before(container.content);
		this.#committed = { kind: 'unsafeHtml', markup, nodes };
	}

	#commitTemplate(result: TemplateResult): void {
		if (this.#committed.kind === 'template' && this.#committed.strings === result.strings) {
			for (let i = 0; i < this.#committed.parts.length; i++) this.#committed.parts[i].update(result.values[i]);
			return;
		}
		this.#clear();
		const { fragment, parts } = instantiate(getTemplate(result.strings));
		const nodes = Array.from(fragment.childNodes);
		this.anchor.before(fragment);
		for (let i = 0; i < parts.length; i++) parts[i].update(result.values[i]);
		this.#committed = { kind: 'template', strings: result.strings, parts, nodes };
	}

	#commitList(values: readonly unknown[]): void {
		if (this.#committed.kind !== 'list') {
			this.#clear();
			this.#committed = { kind: 'list', items: [] };
		}
		const { items } = this.#committed;

		// Shrink: drop (and clean up) any items left over from a previously-longer list.
		while (items.length > values.length) {
			const extra = items.pop()!;
			extra.#clear();
			extra.anchor.remove();
		}
		// Grow: each item gets its own anchor comment, inserted in order right before this part's anchor.
		while (items.length < values.length) {
			const itemAnchor = document.createComment(CHILD_MARKER);
			this.anchor.before(itemAnchor);
			items.push(new ChildPart(itemAnchor));
		}

		for (let i = 0; i < values.length; i++) items[i].update(values[i]);
	}
}

/** Clones `template`'s content and creates a fresh `Part` per recorded descriptor, bound to the clone. */
function instantiate(template: Template): { fragment: DocumentFragment; parts: Part[] } {
	const fragment = template.element.content.cloneNode(true) as DocumentFragment;

	const nodesByIndex: Node[] = [];
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
	let node: Node | null;
	let i = 0;
	while ((node = walker.nextNode())) nodesByIndex[i++] = node;

	const parts = template.parts.map((descriptor): Part => {
		const target = nodesByIndex[descriptor.nodeIndex];
		switch (descriptor.kind) {
			case 'child': return new ChildPart(target as Comment);
			case 'attr': return new AttributePart(target as Element, descriptor.name);
			case 'bool': return new BooleanAttributePart(target as Element, descriptor.name);
			case 'prop': return new PropertyPart(target as Element, descriptor.name);
			case 'event': return new EventPart(target as Element, descriptor.name);
		}
	});

	return { fragment, parts };
}

// --- render(): the public entry point, one call per container. ------------------------------------

interface RenderedInstance {
	strings: TemplateStringsArray;
	parts: Part[];
}

const renderedInstances = new WeakMap<Element | DocumentFragment, RenderedInstance>();

/**
 * Renders `result` into `container`, reusing the previous render's DOM/parts whenever `result` comes
 * from the same tagged-template call site (same `strings` identity) - matching lit-html's contract
 * that only *values* need to be diffed, not structure.
 */
export function render(result: TemplateResult, container: Element | DocumentFragment): void {
	const previous = renderedInstances.get(container);
	if (previous && previous.strings === result.strings) {
		for (let i = 0; i < previous.parts.length; i++) previous.parts[i].update(result.values[i]);
		return;
	}

	container.textContent = '';
	const { fragment, parts } = instantiate(getTemplate(result.strings));
	for (let i = 0; i < parts.length; i++) parts[i].update(result.values[i]);
	container.appendChild(fragment);
	renderedInstances.set(container, { strings: result.strings, parts });
}
