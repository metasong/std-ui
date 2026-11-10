// --- Generic template engine -----------------------------------------------------------------------
//
// Knows only generic concepts: a tagged template (`strings` + interpolations), the markup between
// them, *tags* / *attributes* (an interpolation sits either in text position or in an attribute's
// value), a parsed `<template>` element, and cloning it. It knows nothing about sigils (`.`/`?`/`@`),
// event modifiers, parts, SVG, or dev warnings - every such decision is delegated to `EngineHooks`.
//
// Lifecycle (hooks in [brackets]):
//
//   compile(strings, type)
//     for each interpolation:
//        text position      -> [onTextSlot]                      -> descriptor
//        tag position       -> [onTagSlot]                       -> descriptor (`<div ${x}>`, no name)
//        attribute position -> [onAttributeOpen]   (at opening quote)
//                              ... extra interpolations just extend the same attribute ...
//                              [onAttributeClose]  (at closing quote) -> descriptor
//     [wrapMarkup] -> HTML parse -> [unwrapContent]
//     engine assigns each descriptor its `nodeIndex` and strips attribute placeholders
//     [onCompiled]
//
//   instantiate(template)
//     clone content -> resolve descriptor.nodeIndex to real nodes -> [createPart] per descriptor
//     [onInstantiated]

/** What the engine itself needs from a descriptor; hooks may add anything else they like. */
export interface SlotDescriptor {
	/** Position of the slot's node among all element/comment nodes in document order. Set by the engine. */
	nodeIndex: number;
	/** Number of consecutive interpolation values this slot consumes, in source order. */
	valueCount: number;
}

/** Descriptor as returned by hooks: the engine fills in `nodeIndex`. */
export type DescriptorInit<D extends SlotDescriptor> = Omit<D, 'nodeIndex'> & { nodeIndex?: number };

export interface TextSlotContext {
	/** Markup accumulated so far (everything before this interpolation). */
	readonly markup: string;
}

export interface TagSlotContext {
	/** Markup accumulated so far; ends inside an open tag, e.g. `<div class="a" `. */
	readonly markup: string;
}

export interface AttributeOpenContext {
	/** The attribute's full name exactly as written, including any prefix/suffix characters. */
	readonly rawName: string;
	readonly quote: string;
	/** Static text between the opening quote and the first interpolation. */
	readonly prefix: string;
	/** Markup accumulated so far, for error messages. */
	readonly markup: string;
}

export interface AttributeCloseContext {
	/** Static text segments around the interpolations; always `valueCount + 1` entries. */
	readonly literals: readonly string[];
	readonly valueCount: number;
}

export interface EngineHooks<D extends SlotDescriptor, Part, Type extends string = string, Open = unknown> {
	/** An interpolation in text position (between tags). */
	onTextSlot(ctx: TextSlotContext): DescriptorInit<D>;

	/** An interpolation inside an open tag but not in a `name="..."` value, e.g. `<div ${x}>`.
	 *  Optional: without it such templates are rejected. */
	onTagSlot?(ctx: TagSlotContext): DescriptorInit<D>;

	/** An attribute value's first interpolation was reached. Returns hook-private state for that attribute. */
	onAttributeOpen(ctx: AttributeOpenContext): Open;
	/** The attribute's closing quote was reached. Validate and produce the descriptor. */
	onAttributeClose(open: Open, ctx: AttributeCloseContext): DescriptorInit<D>;

	/** Last chance to change the markup string before it is parsed (e.g. wrap it for a namespace). */
	wrapMarkup?(markup: string, type: Type): string;
	/** Undo `wrapMarkup` on the parsed content, so node indices match the unwrapped markup. */
	unwrapContent?(content: DocumentFragment, type: Type): void;
	/** Template fully compiled and indexed (dev checks, extra analysis...). */
	onCompiled?(template: Template<D>, type: Type): void;

	/** Create the runtime part for one descriptor, bound to its resolved node in a fresh clone. */
	createPart(descriptor: D, node: Node, host?: unknown): Part;
	/** A fresh clone has all its parts created. */
	onInstantiated?(fragment: DocumentFragment, parts: Part[]): void;
}

export interface Template<D extends SlotDescriptor = SlotDescriptor> {
	element: HTMLTemplateElement;
	parts: D[];
}

export interface Engine<D extends SlotDescriptor, Part, Type extends string> {
	/** Cached compile, keyed by the `strings` identity and `type`. */
	getTemplate(strings: TemplateStringsArray, type?: Type): Template<D>;
	instantiate(template: Template<D>, host?: unknown): { fragment: DocumentFragment; parts: Part[] };
}

export interface EngineOptions<Type extends string> {
	/** Marker used for both text-slot comments and attribute placeholders. Default `'std-ui-part'`. */
	marker?: string;
	defaultType: Type;
}

/**
 * Quoted attribute value open at the end of `markup` (before the next `${...}`), e.g. `class="` or `class="foo`.
 *
 * ```
 * (                       start capture group 1 → `rawName` in openAttr
 *   [^\s"'<>\/=]+         one or more chars that are NOT:
 *                           \s  whitespace (name can't contain spaces unquoted)
 *                           " ' angle brackets, slash, equals (tag/attr syntax)
 * )
 * \s*                     optional whitespace before =
 * =                       literal equals
 * \s*                     optional whitespace after =
 * (                       start capture group 2 → opening delimiter → `quote`
 *   ["']                  exactly one " or ' (which char is stored in \2)
 * )
 * (                       start capture group 3 → static text before `${...}` → `prefix`
 *   (?:                   non-capturing group — only the outer ( ) is group 3
 *     (?!\2)              negative lookahead: next position must NOT start with \2
 *                           (stop before the closing quote that matches the opener)
 *     .                   one character (any except line terminators) that passed (?!\2)
 *   )                     end one "prefix character" unit
 *   *                     repeat that unit zero or more times → entire prefix, may be ""
 * )
 * $                       end of string — markup stops exactly at the interpolation gap
 * ```
 *
 * Example: markup = `... class="static-` before `${x}` → (1)=class, (2)=", (3)=static-
 *
 * @see UNQUOTED_ATTR_RE when markup ends at `name=` with no opening quote yet (`class=${x}`).
 */
const ATTR_START_RE = /([^\s"'<>\/=]+)\s*=\s*(["'])((?:(?!\2).)*)$/;

/** Unquoted attribute value about to start at the end of `markup`: `name=`. */
const UNQUOTED_ATTR_RE = /([^\s"'<>\/=]+)\s*=\s*$/;

/** True if `markup` currently sits inside an unclosed tag, i.e. in attribute position. */
function isInsideTag(markup: string): boolean {
	// examples: `<div class="`, `<div class="foo`, `<div `, `<span><a href="x"`
	return markup.lastIndexOf('<') > markup.lastIndexOf('>')/* not exit is -1*/;
}

interface OpenAttr<Open> {
	open: Open;
	quote: string;
	literals: string[];
	valueCount: number;
}

/** Scanner state: between tags, or inside an unclosed quoted attribute value. */
type ScanState<Open> =
	| { readonly kind: 'TEXT' }
	| { readonly kind: 'ATTR_VALUE'; readonly attr: OpenAttr<Open> };

export function createEngine<D extends SlotDescriptor, Part, Type extends string, Open = unknown>(
	hooks: EngineHooks<D, Part, Type, Open>,
	options: EngineOptions<Type>,
): Engine<D, Part, Type> {
	const MARKER = options.marker ?? 'std-ui-part';
	const MARKER_COMMENT = `<!--${MARKER}-->`;
	/** Tag-level slots have no attribute of their own, so a placeholder attribute (valued `MARKER`) is
	 *  injected; names must be unique per element since the parser drops duplicate attributes. */
	const tagMarker = (n: number) => ` ${MARKER}-tag-${n}="${MARKER}"`;
	const TEXT: ScanState<Open> = { kind: 'TEXT' };
	const cache = new WeakMap<TemplateStringsArray, Partial<Record<Type, Template<D>>>>();

	const finalize = (init: DescriptorInit<D>): D => {
		init.nodeIndex = -1;
		return init as D;
	};

	/** Starts an attribute binding if `markup` ends inside an open quoted value; `null` otherwise. */
	function openAttr(markup: string): OpenAttr<Open> | null {
		const match = ATTR_START_RE.exec(markup);
		if (!match) return null;
		const [, rawName, quote, prefix] = match;
		const open = hooks.onAttributeOpen({ rawName, quote, prefix, markup });
		return { open, quote, literals: [prefix], valueCount: 1 };
	}

	function closeAttr(attr: OpenAttr<Open>): D {
		return finalize(hooks.onAttributeClose(attr.open, { literals: attr.literals, valueCount: attr.valueCount }));
	}

	function stepAttrValue(
		attr: OpenAttr<Open>,
		chunk: string,
		descriptors: D[],
	): { state: ScanState<Open>; append: string } {
		const quoteIndex = chunk.indexOf(attr.quote);
		if (quoteIndex === -1) {
			attr.literals.push(chunk);
			attr.valueCount++;
			return { state: { kind: 'ATTR_VALUE', attr }, append: '' };
		}
		attr.literals.push(chunk.slice(0, quoteIndex));
		descriptors.push(closeAttr(attr));
		return { state: TEXT, append: MARKER + chunk.slice(quoteIndex) };
	}

	/** `rewind`: trailing chars of `markup` to drop - the attribute's static prefix is recomposed at
	 *  render time from `literals`, so it must not stay in the markup next to the placeholder. */
	function stepText(
		markup: string,
		descriptors: D[],
		counters: { tagSlots: number },
	): { state: ScanState<Open>; append: string; rewind: number } {
		if (isInsideTag(markup)) {
			// The interpolation sits inside an opening tag. Two possibilities:

			// 1. Attribute slot - it is the value of a quoted attribute: `<div class="${x}">`.
			//    Keep scanning until the closing quote.
			const attr = openAttr(markup);
			if (attr) {
				// Quoted in source; ATTR_START_RE matched — opening `"` or `'` is already in markup.
				// Example: t`<div class="static-${x}"></div>` → strings[0] ends with `class="static-`.
				// Example: t`<div class="${x}"></div>`     → prefix "" (opening quote only).
				//
				// markup before return:     `<div class="static-`
				// rewind prefix length:     `<div class="`  (prefix lives in attr.literals[0] for runtime join)
				// append '':               wait for closing quote in a later strings[i] via stepAttrValue
				// then MARKER replaces value: `<div class="std-ui-part">`
				//
				// Multiple `${...}` in one value stay ATTR_VALUE until the matching closing quote.
				// state ATTR_VALUE: next gaps use stepAttrValue, not another openAttr.
				return { state: { kind: 'ATTR_VALUE', attr }, append: '', rewind: attr.literals[0].length };
			}

			// 2. Tag slot - it belongs to the tag itself, with no attribute name: `<div ${directive()}>`.
			//    Not allowed: an unquoted attribute value (`<div a=${x}>`), or hooks without `onTagSlot`.
			// 1b. Unquoted attribute slot (lit-style): `<div class=${x}>` - exactly one interpolation,
			//     closed immediately. A quoted placeholder is emitted so the parser sees a valid attribute.
			const unquoted = UNQUOTED_ATTR_RE.exec(markup);
			if (unquoted) {
				const open = hooks.onAttributeOpen({ rawName: unquoted[1], quote: '', prefix: '', markup });
				descriptors.push(closeAttr({ open, quote: '', literals: ['', ''], valueCount: 1 }));
				// Unquoted in source; one `${...}` only (no quote delimiter to scan in later strings).
				// Example: t`<div class=${x}></div>` → strings[0] ends with `class=` at this gap.
				//
				// markup before return:     `<div class=`
				// append `"${MARKER}"`:     `<div class="std-ui-part"`  (quotes added for innerHTML only)
				// strings[1] then adds:    `>`
				//
				// Runtime: literals ['', ''] + valueCount 1 → setAttribute('class', '' + x + '').
				// state TEXT (not ATTR_VALUE): attribute part is complete; no stepAttrValue pass.
				// rewind 0: nothing was moved into literals from trailing markup (contrast quoted prefix).
				return { state: TEXT, append: `"${MARKER}"`, rewind: 0 };
			}

			if (!hooks.onTagSlot) {
				throw new Error(
					`std-ui html: unsupported interpolation inside a tag near "...${markup.slice(-40)}" ` +
						`- tag-level interpolations are not supported here.`,
				);
			}
			descriptors.push(finalize(hooks.onTagSlot({ markup })));
			return { state: TEXT, append: tagMarker(counters.tagSlots++), rewind: 0 };
		}
		descriptors.push(finalize(hooks.onTextSlot({ markup })));
		return { state: TEXT, append: MARKER_COMMENT, rewind: 0 };
	}

	function buildMarkup(strings: TemplateStringsArray): { markup: string; descriptors: D[] } {
		let markup = '';
		const descriptors: D[] = [];
		let state: ScanState<Open> = TEXT;
		const counters = { tagSlots: 0 };

		for (let i = 0; i < strings.length - 1; i++) {
			const chunk = strings[i];

			if (state.kind === 'ATTR_VALUE') {
				const step = stepAttrValue(state.attr, chunk, descriptors);
				state = step.state;
				markup += step.append;
				// Still inside the attribute: this interpolation extended it. Otherwise the closing
				// quote was found mid-chunk and *this* interpolation needs a fresh decision below.
				if (state.kind === 'ATTR_VALUE') continue;
			}
			else {
				markup += chunk;
			}

			const step = stepText(markup, descriptors, counters);
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
			markup += MARKER + lastChunk.slice(quoteIndex);
		}
		else {
			markup += lastChunk;
		}
		return { markup, descriptors };
	}

	/** Walks `root` in document order, assigning each descriptor's `nodeIndex` and stripping placeholders. */
	function resolveIndices(root: DocumentFragment, descriptors: D[]): void {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
		let descriptorIndex = 0;
		let nodeIndex = 0;
		let node: Node | null;

		while ((node = walker.nextNode())) {
			if (node.nodeType === Node.COMMENT_NODE && node.textContent === MARKER) {
				descriptors[descriptorIndex++].nodeIndex = nodeIndex;
			}
			else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as Element;
				// Snapshot names: removing while iterating live `el.attributes` would skip entries.
				for (const attrName of Array.from(el.attributes).map(a => a.name)) {
					if (el.getAttribute(attrName) === MARKER) {
						descriptors[descriptorIndex++].nodeIndex = nodeIndex;
						el.removeAttribute(attrName);
					}
				}
			}
			nodeIndex++;
		}
	}

	function compile(strings: TemplateStringsArray, type: Type): Template<D> {
		const { markup, descriptors } = buildMarkup(strings);
		const element = document.createElement('template');
		element.innerHTML = hooks.wrapMarkup ? hooks.wrapMarkup(markup, type) : markup;
		hooks.unwrapContent?.(element.content, type);
		resolveIndices(element.content, descriptors);
		const template: Template<D> = { element, parts: descriptors };
		hooks.onCompiled?.(template, type);
		return template;
	}

	return {
		getTemplate(strings, type = options.defaultType) {
			let byType = cache.get(strings);
			if (!byType) {
				byType = {};
				cache.set(strings, byType);
			}
			return (byType[type] ??= compile(strings, type));
		},

		instantiate(template, host) {
			const fragment = template.element.content.cloneNode(true) as DocumentFragment;
			const nodes: Node[] = [];
			const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
			let node: Node | null;
			let i = 0;
			while ((node = walker.nextNode())) nodes[i++] = node;

			const parts = template.parts.map(d => hooks.createPart(d, nodes[d.nodeIndex], host));
			hooks.onInstantiated?.(fragment, parts);
			return { fragment, parts };
		},
	};
}
