import { describe, expect, it } from 'vitest';
import { beginRawBody, feedRawBody, insideComment, openRawTextElement } from './raw-text.js';

describe('openRawTextElement', () => {
	it('finds the open raw-text element and the index of its opening `>`', () => {
		const markup = '<p>x</p><TITLE class="a">abc ';
		const open = openRawTextElement(markup, false)!;
		expect(open.tag).toBe('title');
		expect(markup[open.tagEnd]).toBe('>');
		expect(markup.slice(open.tagEnd + 1)).toBe('abc ');
	});

	it.each([
		['after the element closed', '<title>t</title><p>'],
		['in plain markup', '<div class="a">'],
		['for a longer tag name', '<titlex>'],
	])('returns null %s', (_name, markup) => {
		expect(openRawTextElement(markup, false)).toBeNull();
	});

	it('ignores raw-text tags in foreign content', () => {
		expect(openRawTextElement('<svg><title>', false)).toBeNull();
		expect(openRawTextElement('<math><style>', false)).toBeNull();
		expect(openRawTextElement('<title>', true)).toBeNull();
		expect(openRawTextElement('<svg></svg><title>', false)?.tag).toBe('title');
		expect(openRawTextElement('<svg/><title>', false)?.tag).toBe('title');
	});
});

describe('comments mentioning tags', () => {
	it('ignores raw-text and svg tags inside closed comments', () => {
		expect(openRawTextElement('<!-- <title> --><p>', false)).toBeNull();
		expect(openRawTextElement('<!-- <svg> --><title>', false)?.tag).toBe('title');
		expect(openRawTextElement('<title>a</title><!-- </title> -->', false)).toBeNull();
	});
});

describe('insideComment', () => {
	it('is true only while a comment is unclosed', () => {
		expect(insideComment('<!-- a ')).toBe(true);
		expect(insideComment('<!-- a --> b')).toBe(false);
		expect(insideComment('<p>')).toBe(false);
	});
});

describe('beginRawBody / feedRawBody', () => {
	it('collects literals across slots until the closing tag', () => {
		const markup = '<textarea rows="2">abc ';
		const open = openRawTextElement(markup, false)!;
		const { body, rewind } = beginRawBody(markup, open);
		expect(rewind).toBe(markup.length - open.tagEnd);
		expect(body).toEqual({ tag: 'textarea', literals: ['abc '], valueCount: 1 });

		expect(feedRawBody(body, ' dsd ')).toBeNull();
		expect(body.valueCount).toBe(2);
		expect(feedRawBody(body, 'sdd</TEXTAREA><p>')).toBe('</TEXTAREA><p>');
		expect(body.literals).toEqual(['abc ', ' dsd ', 'sdd']);
		expect(body.valueCount).toBe(2);
	});

	it('does not close on a longer tag name or a different tag', () => {
		const { body } = beginRawBody('<title>', { tag: 'title', tagEnd: 6 });
		expect(feedRawBody(body, '</titlex> </style>')).toBeNull();
		expect(feedRawBody(body, '</title >')).toBe('</title >');
	});
});
