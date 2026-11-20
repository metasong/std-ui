import { describe, expect, it } from 'vitest';
import { AttributePart, ChildPart } from '../../parts/index.js';
import { isDirectiveResult } from '../directive.js';
import { unsafeHtml } from './index.js';

describe('unsafeHtml', () => {
	it('returns an opaque directive result, not the markup wrapper directly', () => {
		// `unsafeHtml()` is a directive() now - calling it just captures the markup + Ctor into an
		// inert DirectiveResult; it's not resolved into the real `{ markup, ... }` wrapper until
		// applied to a real ChildPart. End-to-end rendering is covered by parts/parts.test.ts's "renders
		// html markup as real parsed nodes".
		expect(isDirectiveResult(unsafeHtml('<b>hi</b>'))).toBe(true);
	});

	it('throws if bound to an attribute position instead of a child one', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'title');
		expect(() => part.update([unsafeHtml('<b>hi</b>')])).toThrow();
	});

	it('renders real parsed nodes when bound to a child position', () => {
		const container = document.createElement('div');
		const anchor = document.createComment('');
		container.append(anchor);
		const part = new ChildPart(anchor);
		part.update([unsafeHtml('<em>hi</em>')]);
		expect(container.querySelector('em')!.textContent).toBe('hi');
	});
});
