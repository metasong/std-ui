// Tiny TypeScript/JavaScript tokenizer for the demo code tabs: comments, strings, template literals
// (nesting `${ ... }` and inner backticks is handled), keywords, numbers and decorators. No dependencies.

export type TokenKind = 'comment' | 'string' | 'keyword' | 'number' | 'decorator' | 'plain';
export interface Token { readonly kind: TokenKind; readonly text: string }

const KEYWORDS = new Set((
	'abstract as async await break case catch class const continue debugger default delete do else enum export ' +
	'extends false finally for from function get if implements import in instanceof interface let new null of ' +
	'override private protected public readonly return set static super switch this throw true try type typeof ' +
	'undefined var void while yield declare keyof satisfies unknown never any string number boolean object'
).split(' '));

const IDENT = /[A-Za-z_$][\w$]*/y;
const NUMBER = /\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?/iy;

function skipQuoted(src: string, i: number): number {
	const quote = src[i++];
	while (i < src.length && src[i] !== quote && src[i] !== '\n') i += src[i] === '\\' ? 2 : 1;
	return Math.min(i + 1, src.length);
}

/** `i` is at the opening backtick; returns the index after the closing one. */
function skipTemplate(src: string, i: number): number {
	i++;
	while (i < src.length) {
		const ch = src[i];
		if (ch === '\\') i += 2;
		else if (ch === '`') return i + 1;
		else if (ch === '$' && src[i + 1] === '{') i = skipBraces(src, i + 2);
		else i++;
	}
	return src.length;
}

/** `i` is just after `${`; returns the index after the matching `}`. */
function skipBraces(src: string, i: number): number {
	let depth = 1;
	while (i < src.length) {
		const ch = src[i];
		if (ch === '`') i = skipTemplate(src, i);
		else if (ch === "'" || ch === '"') i = skipQuoted(src, i);
		else if (ch === '{') { depth++; i++; }
		else if (ch === '}') { if (--depth === 0) return i + 1; i++; }
		else i++;
	}
	return src.length;
}

function match(re: RegExp, src: string, i: number): string | undefined {
	re.lastIndex = i;
	return re.exec(src)?.[0];
}

export function tokenize(src: string): Token[] {
	const tokens: Token[] = [];
	let plainStart = 0;
	let i = 0;

	const push = (kind: TokenKind, end: number): void => {
		if (plainStart < i) tokens.push({ kind: 'plain', text: src.slice(plainStart, i) });
		tokens.push({ kind, text: src.slice(i, end) });
		i = plainStart = end;
	};

	while (i < src.length) {
		const ch = src[i];
		const next = src[i + 1];
		if (ch === '/' && next === '/') {
			const eol = src.indexOf('\n', i);
			push('comment', eol < 0 ? src.length : eol);
		} else if (ch === '/' && next === '*') {
			const close = src.indexOf('*/', i + 2);
			push('comment', close < 0 ? src.length : close + 2);
		} else if (ch === "'" || ch === '"') {
			push('string', skipQuoted(src, i));
		} else if (ch === '`') {
			push('string', skipTemplate(src, i));
		} else if (ch === '@' && /[A-Za-z_]/.test(next ?? '')) {
			push('decorator', i + 1 + match(IDENT, src, i + 1)!.length);
		} else if (/\d/.test(ch)) {
			push('number', i + match(NUMBER, src, i)!.length);
		} else if (/[A-Za-z_$]/.test(ch)) {
			const word = match(IDENT, src, i)!;
			if (KEYWORDS.has(word)) push('keyword', i + word.length);
			else i += word.length;
		} else {
			i++;
		}
	}
	if (plainStart < src.length) tokens.push({ kind: 'plain', text: src.slice(plainStart) });
	return tokens;
}
