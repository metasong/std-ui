import { describe, expect, it } from 'vitest';
import { AttributePart } from '../../parts/index.js';
import { classMap } from './index.js';

describe('classMap', () => {
	it('adds truthy keys as classes, ignores falsy ones (via the imperative update() path)', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class');
		part.update([classMap({ active: true, hidden: false })]);
		expect(el.classList.contains('active')).toBe(true);
		expect(el.classList.contains('hidden')).toBe(false);
	});

	it('leaves classes from static markup/elsewhere untouched', () => {
		const el = document.createElement('div');
		el.className = 'static-class';
		const part = new AttributePart(el, 'class');
		part.update([classMap({ active: true })]);
		expect(el.classList.contains('static-class')).toBe(true);
	});

	it('removes, on a later update, classes that drop out or turn falsy', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class');
		part.update([classMap({ active: true, selected: true })]);
		part.update([classMap({ active: false })]);
		expect(el.classList.contains('active')).toBe(false);
		expect(el.classList.contains('selected')).toBe(false);
	});

	it('throws if bound to an attribute other than "class"', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'id');
		expect(() => part.update([classMap({ active: true })])).toThrow();
	});

	it('coexists with static text in the same "class" attribute', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class', ['base ', ' trailing']);
		part.update([classMap({ active: true })]);
		expect(el.classList.contains('base')).toBe(true);
		expect(el.classList.contains('trailing')).toBe(true);
		expect(el.classList.contains('active')).toBe(true);

		part.update([classMap({ active: false })]);
		expect(el.classList.contains('active')).toBe(false);
		expect(el.classList.contains('base')).toBe(true); // static tokens untouched by the directive toggling
		expect(el.classList.contains('trailing')).toBe(true);
	});
});
