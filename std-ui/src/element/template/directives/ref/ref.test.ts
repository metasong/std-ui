import { describe, expect, it, vi } from 'vitest';
import { t } from '../../html/index.js';
import { render, unmount } from '../../html/render.js';
import { createRef, ref } from './index.js';

describe('ref directive', () => {
	it('fills a Ref with the element after render', () => {
		const input = createRef<HTMLInputElement>();
		const host = document.createElement('div');
		render(t`<input ${ref(input)} id="a">`, host);
		expect(input.value).toBe(host.querySelector('input'));
		expect(host.querySelector('input')!.id).toBe('a');
		expect(host.querySelector('input')!.getAttributeNames().some(n => n.startsWith('std-ui'))).toBe(false);
	});

	it('calls a callback with the element, then undefined on teardown', () => {
		const cb = vi.fn();
		const host = document.createElement('div');
		render(t`<div ${ref(cb)}></div>`, host);
		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenLastCalledWith(host.firstElementChild);
		unmount(host);
		expect(cb).toHaveBeenLastCalledWith(undefined);
	});

	it('does not re-fire on re-render with the same ref', () => {
		const cb = vi.fn();
		const host = document.createElement('div');
		const view = () => t`<div ${ref(cb)}></div>`;
		render(view(), host);
		render(view(), host);
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it('clears the old ref and sets the new one when the ref changes', () => {
		const a = createRef();
		const b = createRef();
		const host = document.createElement('div');
		render(t`<div ${ref(a)}></div>`, host);
		render(t`<div ${ref(b)}></div>`, host);
		expect(a.value).toBeUndefined();
		expect(b.value).toBe(host.firstElementChild);
	});

	it('supports several element slots plus attributes on one element', () => {
		const a = createRef();
		const b = createRef();
		const host = document.createElement('div');
		render(t`<div class=${'x'} ${ref(a)} ${ref(b)}></div>`, host);
		expect(a.value).toBe(host.firstElementChild);
		expect(b.value).toBe(host.firstElementChild);
		expect(host.firstElementChild!.className).toBe('x');
	});

	it('ignores falsy values and rejects non-directives in an element slot', () => {
		const host = document.createElement('div');
		expect(() => render(t`<div ${false}></div>`, host)).not.toThrow();
		expect(() => render(t`<div ${'oops'}></div>`, document.createElement('div'))).toThrow();
	});

	it('supports unquoted attribute values', () => {
		const host = document.createElement('div');
		render(t`<div a=${1}></div>`, host);
		expect(host.firstElementChild!.getAttribute('a')).toBe('1');
	});
});
