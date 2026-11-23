import { DEV } from '../../../../dev/flag.js';
import { usageError } from '../../../../util.js';

// --- Raw-text context detection ---------------------------------------------------------------------
//
// The HTML parser reads the body of `<title>`, `<textarea>`, `<style>` and `<script>` (and HTML comments)
// as plain text, so a marker comment placed there would become literal text and its part could never find
// its node. The scanner uses these helpers to recognise such positions: bodies are bound as one string
// (see `onRawTextBody`), comments are rejected. Inside `<svg>`/`<math>` the same tags hold normal markup,
// so nothing special happens there. See `design.md` ("Raw-text bodies") for a full walkthrough.

/** Opening or closing tag of an element whose content the HTML parser reads as raw text. Closed comments are
 *  matched first (and have no groups) so a tag mentioned inside `<!-- ... -->` is skipped. */
const RAW_TEXT_TAG_RE = /<!--[\s\S]*?-->|<(\/?)(style|script|textarea|title)(?=[\s/>])[^>]*>/gi;

/** Cheap pre-check: can `markup` contain a raw-text tag at all? (No `g` flag, so `.test` keeps no state.) */
const MAY_HAVE_RAW_TEXT_RE = /<(?:style|script|textarea|title)/i;

/** Opening or closing `<svg>`/`<math>` tag; group 3 is `/` for a self-closing one. Skips closed comments like above. */
const FOREIGN_TAG_RE = /<!--[\s\S]*?-->|<(\/?)(svg|math)(?=[\s/>])[^>]*?(\/?)>/gi;

/** True if `markup` ends inside an unclosed `<svg>`/`<math>`, where elements such as `<title>` hold normal markup. */
function insideForeignElement(markup: string): boolean {
	let depth = 0;
	for (const match of markup.matchAll(FOREIGN_TAG_RE)) {
		if (!match[2] || match[3]) continue; // a comment, or self-closing
		depth += match[1] ? -1 : 1;
	}
	return depth > 0;
}

/** True if `markup` ends inside an unclosed HTML comment. */
export function insideComment(markup: string): boolean {
	const commentStart = markup.lastIndexOf('<!--');
	return commentStart !== -1 && markup.indexOf('-->', commentStart + 4) === -1;
}

/** The raw-text element (`<textarea>`, `<style>`, `<script>`, `<title>`) of HTML content that the end of
 *  `markup` sits in, or `null`. `tagEnd` is the index of the opening tag's `>`.
 *  `foreignRoot`: the whole template is SVG/MathML (`svg\`...\``), where those elements are ordinary. */
export function openRawTextElement(markup: string, foreignRoot: boolean): { tag: string; tagEnd: number } | null {
	// Fast exit for the common template with no raw-text tag at all: one plain regex test, no match objects.
	if (foreignRoot || !MAY_HAVE_RAW_TEXT_RE.test(markup) || insideForeignElement(markup)) return null;
	let open: { tag: string; tagEnd: number } | null = null;
	for (const match of markup.matchAll(RAW_TEXT_TAG_RE)) {
		if (!match[2]) continue; // a comment
		open = match[1] ? null : { tag: match[2].toLowerCase(), tagEnd: match.index + match[0].length - 1 };
	}
	return open;
}

/** A raw-text body being collected: its static text segments so far and how many `${}` it holds. */
export interface OpenRawBody {
	tag: string;
	/** Static text around the slots; `valueCount + 1` entries once the body is closed. */
	literals: string[];
	valueCount: number;
}

/** Starts collecting the body of `raw`, at its first interpolation. The static text already in `markup`
 *  after the opening tag becomes `literals[0]`; `rewind` is how many trailing chars of `markup` to drop
 *  (from the opening tag's `>` on) so the scanner can re-add the tag with a placeholder attribute. */
export function beginRawBody(markup: string, raw: { tag: string; tagEnd: number }): { body: OpenRawBody; rewind: number } {
	// t`<title>abc ${a} dsd ${b}sdd</title>` at `${a}`: markup = `<title>abc `, tagEnd = 6 (the `>`)
	//  - literals[0] = markup.slice(7) = `abc `: the text before the first slot, kept for render time
	//  - valueCount = 1: this interpolation is the body's first value
	//  - rewind = 11 - 6 = 5: drops `>abc ` from the markup; the scanner re-adds `>` after a placeholder attribute
	return {
		body: { tag: raw.tag, literals: [markup.slice(raw.tagEnd + 1)], valueCount: 1 },
		rewind: markup.length - raw.tagEnd,
	};
}

/** Feeds the next static chunk (the text up to the next `${}` or the end of the template) into `body`.
 *  Returns `null` while the body is still open (the chunk was absorbed and one more slot counted), or the
 *  rest of the chunk starting at the closing tag once the body is complete (then `body` is final). */
export function feedRawBody(body: OpenRawBody, chunk: string): string | null {
	// `</title` must be followed by whitespace, `/` or `>`, so `</titlex>` does not close a `<title>`.
	const end = new RegExp(`</${body.tag}(?=[\\s/>])`, 'i').exec(chunk)?.index ?? -1;
	if (end === -1) {
		// Still inside the body: the text up to the next `${}` is static text, and that `${}` is one more value.
		//   chunk ` dsd `  -> literals ['abc ', ' dsd '], valueCount 2
		body.literals.push(chunk);
		body.valueCount++;
		return null;
	}
	// The closing tag is in this chunk, so no further `${}` belongs to the body.
	//   chunk `sdd</title><p>`  -> literals ['abc ', ' dsd ', 'sdd'] (valueCount + 1 entries), returns `</title><p>`
	body.literals.push(chunk.slice(0, end));
	return chunk.slice(end);
}

/** Error for an interpolation the scanner can't place: an HTML comment, or a raw-text element when the
 *  hooks have no `onRawTextBody`. */
export function unsupportedContextError(context: string): Error {
	if (!DEV) return usageError('std-ui: interpolation not supported here', 'template');
	const hint = context === 'an HTML comment'
		? 'remove the ${...} from the comment.'
		: 'provide an `onRawTextBody` hook to bind its text.';
	return usageError(`std-ui html: an interpolation inside ${context} is not supported (its content is not parsed as markup); ${hint}`, 'template');
}
