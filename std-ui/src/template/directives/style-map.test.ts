import { describe, expect, it } from 'vitest';
import { AttributePart } from '../parts.js';
import { styleMap } from './style-map.js';

describe('styleMap', () => {
	it('sets style properties, converting camelCase keys to kebab-case (via the imperative update() path)', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'style');
		part.update([styleMap({ color: 'red', fontSize: '12px' })]);
		expect(el.style.color).toBe('red');
		expect(el.style.fontSize).toBe('12px');
	});

	it('leaves already-kebab-case and custom-property keys untouched', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'style');
		part.update([styleMap({ 'font-size': '12px', '--my-color': 'red' })]);
		expect(el.style.fontSize).toBe('12px');
		expect(el.style.getPropertyValue('--my-color')).toBe('red');
	});

	it('skips null/undefined values', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'style');
		part.update([styleMap({ color: null, fontSize: undefined })]);
		expect(el.style.color).toBe('');
		expect(el.style.fontSize).toBe('');
	});

	it('removes, on a later update, properties that drop out or go nullish', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'style');
		part.update([styleMap({ color: 'red', fontSize: '12px' })]);
		part.update([styleMap({ color: 'blue', fontSize: null })]);
		expect(el.style.color).toBe('blue');
		expect(el.style.fontSize).toBe('');
	});

	it('throws if bound to an attribute other than "style"', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class');
		expect(() => part.update([styleMap({ color: 'red' })])).toThrow();
	});
});
