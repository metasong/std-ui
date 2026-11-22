import { DEV } from '../../../dev/flag.js';
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

/** A compiled template, cached per `strings` identity and type. */
export interface Template<D extends SlotDescriptor = SlotDescriptor> {
	/** Parsed markup with markers in place of interpolations; cloned on each instantiation. */
	element: HTMLTemplateElement;
	/** One descriptor per interpolation, in source order. */
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

/**
 * Unquoted attribute value about to start at the end of `markup` (before the next `${...}`), e.g. `class=`.
 *
 * ```
 * (                       start capture group 1 → attribute name
 *   [^\s"'<>\/=]+         one or more chars that are NOT:
 *                           \s  whitespace (name can't contain spaces unquoted)
 *                           " ' angle brackets, slash, equals (tag/attr syntax)
 * )
 * \s*                     optional whitespace before =
 * =                       literal equals
 * \s*                     optional whitespace after =
 * $                       end of string — markup stops right after `=`, no quote opened
 * ```
 *
 * Example: markup = `<div class=` before `${x}` → (1)=class
 *
 * @see ATTR_START_RE when the value is quoted (`class="${x}"`).
 */
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
const ScanKind = { TEXT: 'TEXT', ATTR_VALUE: 'ATTR_VALUE' } as const;

type ScanState<Open> =
	| { readonly kind: typeof ScanKind.TEXT }
	| { readonly kind: typeof ScanKind.ATTR_VALUE; readonly attr: OpenAttr<Open> };

export function createEngine<D extends SlotDescriptor, Part, Type extends string, Open = unknown>(
	hooks: EngineHooks<D, Part, Type, Open>,
	options: EngineOptions<Type>,
): Engine<D, Part, Type> {
	const MARKER = options.marker ?? 'std-ui-part';
	const MARKER_COMMENT = `<!--${MARKER}-->`;
	/** Tag-level slots have no attribute of their own, so a placeholder attribute (valued `MARKER`) is
	 *  injected; names must be unique per element since the parser drops duplicate attributes. */
	const tagMarker = (n: number) => ` ${MARKER}-tag-${n}="${MARKER}"`;
	const TEXT: ScanState<Open> = { kind: ScanKind.TEXT };
	const cache = new WeakMap<TemplateStringsArray, Partial<Record<Type, Template<D>>>>();

	const finalize = (init: DescriptorInit<D>): D => {
		init.nodeIndex = -1;
		return init as D;
	};

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
			return { state: { kind: ScanKind.ATTR_VALUE, attr }, append: '' };
		}
		attr.literals.push(chunk.slice(0, quoteIndex));
		descriptors.push(closeAttr(attr));
		return { state: TEXT, append: MARKER + chunk.slice(quoteIndex) };
	}

	/** Starts an attribute binding if `markup` ends inside an open quoted value; `null` otherwise. */
	function openAttr(markup: string): OpenAttr<Open> | null {
		const match = ATTR_START_RE.exec(markup);
		if (!match) return null;
		const [, rawName, quote, prefix] = match;
		const open = hooks.onAttributeOpen({ rawName, quote, prefix, markup });
		return { open, quote, literals: [prefix], valueCount: 1 };
	}

	/** `rewind`: trailing chars of `markup` to drop - the attribute's static prefix is recomposed at
	 *  render time from `literals`, so it must not stay in the markup next to the placeholder. */
	function stepText(
		markup: string,
		descriptors: D[],
		counters: { tagSlots: number },
	): { state: ScanState<Open>; append: string; rewind: number } {
		if (isInsideTag(markup)) {
			// The interpolation sits inside an opening tag. Three possibilities, checked in order:

			// 1. Quoted attribute slot - inside the value of a quoted attribute: `<div class="${x}">`.
			//    Keep scanning until the closing quote.
			const attr = openAttr(markup);
			if (attr) {
				// The attribute value is quoted and its opening quote is already in `markup`.
				// Text typed before the `${...}` inside the value (e.g. `static-`) is a literal prefix.
				//
				//   t`<div class="static-${x}">`  -> markup so far: `<div class="static-`, prefix `static-`
				//   t`<div class="${x}">`         -> markup so far: `<div class="`,        prefix ``
				//
				// What happens here:
				//  - The prefix is saved in `attr.literals[0]` and removed from `markup` (via `rewind`),
				//    because it is joined with the interpolated values at runtime, not parsed as HTML.
				//  - Nothing is appended yet: the closing quote has not been seen.
				//  - The state becomes ATTR_VALUE, so later interpolations in the same value go through
				//    `stepAttrValue` until the closing quote is found.
				//  - Once closed, the whole value is replaced by `MARKER`:
				//
				//      t`<div class="static-${x}">`    -> `<div class="std-ui-part">`
				//      t`<div class="a ${x} b ${y}">`  -> `<div class="std-ui-part">`  (one placeholder, two values)
				return { state: { kind: ScanKind.ATTR_VALUE, attr }, append: '', rewind: attr.literals[0].length };
			}

			// 2. Unquoted attribute slot - the value is the whole interpolation: `<div class=${x}>`.
			//    There is no quote to wait for, so the attribute is opened and closed right here.
			const unquoted = UNQUOTED_ATTR_RE.exec(markup);
			if (unquoted) {
				const open = hooks.onAttributeOpen({ rawName: unquoted[1], quote: '', prefix: '', markup });
				descriptors.push(closeAttr({ open, quote: '', literals: ['', ''], valueCount: 1 }));
				// Only one `${...}` is possible (no text before or after it inside the value).
				//
				//   t`<div class=${x}></div>`
				//     markup so far:   `<div class=`           (strings[0])
				//     append:          `"std-ui-part"`         (quotes added so the HTML parser accepts it)
				//     next string:     `></div>`               (strings[1], added by the next loop step)
				//     result:          `<div class="std-ui-part"></div>`
				//
				// What happens here:
				//  - `literals: ['', '']` with `valueCount: 1` means the runtime value is `'' + x + ''`.
				//  - The state goes back to TEXT: the attribute is already complete, so no
				//    `stepAttrValue` pass is needed.
				//  - `rewind: 0`: no prefix exists to move out of `markup` (unlike the quoted case).
				return { state: TEXT, append: `"${MARKER}"`, rewind: 0 };
			}

			// 3. Tag slot - the interpolation belongs to the tag itself, with no attribute name:
			//    `<div ${directive()}>`. It needs the optional `onTagSlot` hook; without it, reject.

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

	/**
	 * Joins the template `strings` into one markup string, replacing each interpolation with a marker
	 * (comment for text slots, placeholder for attributes) and collecting one descriptor per interpolation.
	 * Tracks whether the scanner is in text or inside a quoted attribute value to pick the right hook.
	 */
	function buildMarkup(strings: TemplateStringsArray): { markup: string; descriptors: D[] } {
		let markup = '';
		const descriptors: D[] = [];
		let state: ScanState<Open> = TEXT;
		const counters = { tagSlots: 0 };

		for (let i = 0; i < strings.length - 1; i++) {
			const chunk = strings[i];

			if (state.kind === ScanKind.ATTR_VALUE) {
				const step = stepAttrValue(state.attr, chunk, descriptors);
				state = step.state;
				markup += step.append;
				// Still inside the attribute: this interpolation extended it. Otherwise the closing
				// quote was found mid-chunk and *this* interpolation needs a fresh decision below.
				if (state.kind === ScanKind.ATTR_VALUE) continue;
			}
			else { // TEXT
				markup += chunk;
			}

			const step = stepText(markup, descriptors, counters);
			state = step.state;
			markup = markup.slice(0, markup.length - step.rewind) + step.append;
		}

		const lastChunk = strings[strings.length - 1];
		if (state.kind === ScanKind.ATTR_VALUE) {
			const quoteIndex = lastChunk.indexOf(state.attr.quote);
			if (quoteIndex === -1) {
				throw new Error(DEV ? `std-ui html: unterminated attribute value near "...${lastChunk.slice(-40)}"` : 'std-ui: unterminated attribute value');
			}
			state.attr.literals.push(lastChunk.slice(0, quoteIndex));
			descriptors.push(closeAttr(state.attr));
			markup += MARKER + lastChunk.slice(quoteIndex);
		}
		else {
			markup += lastChunk;
		}
		// Example: t`<p class="a ${x}" title="e${y}f${z}g" ${d}>Hi ${w}!</p>` returns
		//   markup:      `<p class="std-ui-part" title="std-ui-part" std-ui-part-tag-0="std-ui-part">Hi <!--std-ui-part-->!</p>`
		//   descriptors (source order; shape is up to the hooks, shown here for `PartDescriptor`):
		//     [
		//       { kind: ATTRIBUTE, name: 'class', literals: ['a ', ''],         valueCount: 1 },  // `class="a ${x}"`
		//       { kind: ATTRIBUTE, name: 'title', literals: ['e', 'f', 'g'],    valueCount: 2 },  // `title="e${y}f${z}g"`
		//       { kind: ELEMENT,   name: '',                                    valueCount: 1 },  // tag slot `${d}`
		//       { kind: CHILD,     name: '',                                    valueCount: 1 },  // text slot `${w}` (the text around it stays in `markup`)
		//     ]
		// An attribute with several interpolations is still one descriptor and one placeholder:
		// `literals` always has `valueCount + 1` entries, joined at runtime as `'e' + y + 'f' + z + 'g'`.
		// The tag slot has no attribute of its own, so it is marked with a placeholder attribute
		// (`std-ui-part-tag-N`, N counts tag slots) that lets the engine find its element.
		// The engine only requires `nodeIndex` and `valueCount`. `nodeIndex` is filled in later by
		// `resolveIndices`: the index of the placeholder's node among all elements/comments in the
		// parsed markup (text nodes are not counted). Here 0 for the attribute and tag slot (both
		// live on `<p>`) and 1 for the `<!--std-ui-part-->` comment.
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
		// Running example: t`<p class="a ${x}" title="e${y}f${z}g" ${d}>Hi ${w}!</p>`

		// Step 1: join the strings, replacing each interpolation with a marker (see `buildMarkup`).
		//   markup:      `<p class="std-ui-part" title="std-ui-part" std-ui-part-tag-0="std-ui-part">Hi <!--std-ui-part-->!</p>`
		//   descriptors: [class, title, tag slot, text slot], none has a `nodeIndex` yet.
		const { markup, descriptors } = buildMarkup(strings);

		// Step 2: parse the markup (optionally wrapped, e.g. in `<svg>`, so nodes get the right namespace).
		//   element.content: <p class="std-ui-part" title="std-ui-part" std-ui-part-tag-0="std-ui-part">
		//                      "Hi " <!--std-ui-part--> "!"
		//                    </p>
		const element = document.createElement('template');
		element.innerHTML = hooks.wrapMarkup ? hooks.wrapMarkup(markup, type) : markup;

		// Step 3: remove the wrapper again, so node indices match the unwrapped markup.
		//   (no-op in this example, as nothing was wrapped)
		hooks.unwrapContent?.(element.content, type);

		// Step 4: walk the nodes in document order, give each descriptor its `nodeIndex`, and strip the
		// placeholder attributes. Text nodes are not counted; the text-slot comment is kept as the anchor.
		//   element.content: <p>Hi <!--std-ui-part-->!</p>
		//   class, title, tag slot -> nodeIndex 0 (`<p>`), text slot -> nodeIndex 1 (the comment)
		resolveIndices(element.content, descriptors);

		// Step 5: the finished template. `instantiate` clones `element.content` and uses each `nodeIndex`
		// to find the node for its part.
		//   parts: [
		//     { kind: ATTRIBUTE, name: 'class', literals: ['a ', ''],      valueCount: 1, nodeIndex: 0 },
		//     { kind: ATTRIBUTE, name: 'title', literals: ['e', 'f', 'g'], valueCount: 2, nodeIndex: 0 },
		//     { kind: ELEMENT,   name: '',                                 valueCount: 1, nodeIndex: 0 },
		//     { kind: CHILD,     name: '',                                 valueCount: 1, nodeIndex: 1 },
		//   ]
		const template: Template<D> = { element, parts: descriptors };
		hooks.onCompiled?.(template, type);
		return template;
	}

	return {
		/**
		 * @param strings The tagged template's `strings` array. The same call site always passes the
		 *   same array object, so it is the cache key (a `WeakMap`, entries go away with it).
		 * @param type How to parse the markup (e.g. `'html'` or `'svg'`), defaults to `options.defaultType`.
		 *   The same `strings` can be compiled once per type, so the cache is `strings` -> `type` -> template.
		 */
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
