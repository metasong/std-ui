import { DEV } from '../../../../dev/flag.js';
import type { BuilderHooks, DescriptorInit, SlotDescriptor } from './types.js';

// --- Markup scanner ---------------------------------------------------------------------------------
//
// Phase 1 of building: joins the template `strings` into one markup string, replacing each
// interpolation with a marker and collecting one descriptor per interpolation. Decides *where* each
// interpolation sits (text / tag / quoted or unquoted attribute) and delegates to the hooks.

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

export interface MarkupScanResult<D extends SlotDescriptor> {
	markup: string;
	descriptors: D[];
}

export type MarkupScanner<D extends SlotDescriptor> = (strings: TemplateStringsArray) => MarkupScanResult<D>;

export function createMarkupScanner<D extends SlotDescriptor, Part, Type extends string, Open>(
	hooks: BuilderHooks<D, Part, Type, Open>,
	marker: string,
): MarkupScanner<D> {
	const MARKER_COMMENT = `<!--${marker}-->`;
	/** Tag-level slots have no attribute of their own, so a placeholder attribute (valued `marker`) is
	 *  injected; names must be unique per element since the parser drops duplicate attributes. */
	const tagMarker = (n: number) => ` ${marker}-tag-${n}="${marker}"`;
	const TEXT: ScanState<Open> = { kind: ScanKind.TEXT };

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
		return { state: TEXT, append: marker + chunk.slice(quoteIndex) };
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
				// Text typed before the `${...}` inside the value (e.g. `static-`) is a literal prefix.
				//
				//   t`<div class="static-${x}">`  -> markup so far: `<div class="static-`, prefix `static-`
				//   t`<div class="${x}">`         -> markup so far: `<div class="`,        prefix ``
				//
				//  - The prefix is saved in `attr.literals[0]` and removed from `markup` (via `rewind`),
				//    because it is joined with the interpolated values at runtime, not parsed as HTML.
				//  - Nothing is appended yet: the closing quote has not been seen.
				//  - The state becomes ATTR_VALUE, so later interpolations in the same value go through
				//    `stepAttrValue` until the closing quote is found.
				//  - Once closed, the whole value is replaced by the marker:
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
				// t`<div class=${x}></div>`
				//   markup so far:   `<div class=`
				//   append:          `"std-ui-part"`   (quotes added so the HTML parser accepts it)
				//   result:          `<div class="std-ui-part"></div>`
				//  - `literals: ['', '']` with `valueCount: 1` means the runtime value is `'' + x + ''`.
				//  - State goes back to TEXT: the attribute is already complete.
				//  - `rewind: 0`: no prefix exists to move out of `markup`.
				return { state: TEXT, append: `"${marker}"`, rewind: 0 };
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
	 *
	 * Example: t`<p class="a ${x}" title="e${y}f${z}g" ${d}>Hi ${w}!</p>` returns
	 *   markup:      `<p class="std-ui-part" title="std-ui-part" std-ui-part-tag-0="std-ui-part">Hi <!--std-ui-part-->!</p>`
	 *   descriptors (source order; shape is up to the hooks, shown here for `PartDescriptor`):
	 *     [
	 *       { kind: ATTRIBUTE, name: 'class', literals: ['a ', ''],         valueCount: 1 },  // `class="a ${x}"`
	 *       { kind: ATTRIBUTE, name: 'title', literals: ['e', 'f', 'g'],    valueCount: 2 },  // `title="e${y}f${z}g"`
	 *       { kind: ELEMENT,   name: '',                                    valueCount: 1 },  // tag slot `${d}`
	 *       { kind: CHILD,     name: '',                                    valueCount: 1 },  // text slot `${w}`
	 *     ]
	 * An attribute with several interpolations is still one descriptor and one placeholder:
	 * `literals` always has `valueCount + 1` entries, joined at runtime as `'e' + y + 'f' + z + 'g'`.
	 * The tag slot is marked with a placeholder attribute (`std-ui-part-tag-N`) that lets the Builder
	 * find its element. `nodeIndex` is filled in later by `resolveIndices`.
	 */
	return function scanMarkup(strings) {
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
			markup += marker + lastChunk.slice(quoteIndex);
		}
		else {
			markup += lastChunk;
		}
		return { markup, descriptors };
	};
}
