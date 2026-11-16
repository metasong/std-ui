import { describe, expect, it, vi } from 'vitest';
import { getTemplate, instantiate } from './compile.js';
import { t, svg } from '../html/index.js';
import { updateParts } from '../parts/index.js';

describe('getTemplate/instantiate', () => {
	it('compiles a child binding to a comment-anchored ChildPart', () => {
		const { strings } = t`<p>Hello, ${'Ada'}!</p>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0].kind).toBe('child');

		const { fragment, parts } = instantiate(template);
		expect(parts).toHaveLength(1);
		const p = fragment.querySelector('p')!;
		expect(p.textContent).toBe('Hello, !'); // comment anchor renders as nothing until updated
		expect(p.childNodes[1].nodeType).toBe(Node.COMMENT_NODE);
	});

	it('compiles a plain attribute binding', () => {
		const { strings } = t`<div id="${'x'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({ kind: 'attr', name: 'id' });
		// the marker attribute is stripped out of the parsed template entirely
		const { fragment } = instantiate(template);
		expect(fragment.querySelector('div')!.hasAttribute('id')).toBe(false);
	});

	it('recognizes ?/./@-prefixed bindings as bool/prop/event kinds', () => {
		const { strings } = t`<input ?disabled="${true}" .value="${'v'}" @click="${() => {}}" />`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => [p.kind, p.name])).toEqual([
			['bool', 'disabled'],
			['prop', 'value'],
			['event', 'click'],
		]);
	});

	it('keeps `.modifier`s on an `@`-prefixed event binding, in source order', () => {
		const { strings } = t`<button @click.once.capture.passive="${() => {}}"></button>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({
			kind: 'event',
			name: 'click',
			modifiers: [{ name: 'once' }, { name: 'capture' }, { name: 'passive' }],
		});
	});

	it('applies `.once` and `.prevent`/`.stop` modifiers when the part is created', () => {
		const handler = vi.fn();
		const { strings, values } = t`<form @submit.prevent.stop.once="${handler}"></form>`;
		const { fragment, parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		const form = fragment.querySelector('form')!;

		const first = new Event('submit', { cancelable: true });
		form.dispatchEvent(first);
		form.dispatchEvent(new Event('submit', { cancelable: true }));
		expect(first.defaultPrevented).toBe(true);
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('ignores unknown modifiers on an event binding', () => {
		const { strings, values } = t`<button @click.bogus="${vi.fn()}"></button>`;
		const template = getTemplate(strings);
		expect(template.parts[0].modifiers).toEqual([{ name: 'bogus' }]);
		const { fragment, parts } = instantiate(template);
		updateParts(parts, values);
		fragment.querySelector('button')!.click();
		expect(values[0]).toHaveBeenCalledTimes(1);
	});

	it('parses `:arg` on modifiers', () => {
		const { strings } = t`<input @input.bogus:300="${() => {}}" />`;
		expect(getTemplate(strings).parts[0].modifiers).toEqual([{ name: 'bogus', arg: '300' }]);
	});

	it('compiles class:name and style:prop bindings', () => {
		const { strings, values } = t`<div class:active="${true}" style:--gap=${'4px'} style:color="${'red'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => [p.kind, p.name, p.arg])).toEqual([
			['attr', 'class', 'active'],
			['attr', 'style', '--gap'],
			['attr', 'style', 'color'],
		]);
		const { fragment, parts } = instantiate(template);
		updateParts(parts, values);
		const div = fragment.querySelector('div')!;
		expect(div.classList.contains('active')).toBe(true);
		expect(div.style.color).toBe('red');
		expect(div.style.getPropertyValue('--gap')).toBe('4px');
	});

	it('rejects `:arg` on names other than class/style', () => {
		const { strings } = t`<div foo:bar="${1}"></div>`;
		expect(() => getTemplate(strings)).toThrow(/:arg/);
	});

	it('rejects static text in a class:name binding', () => {
		const { strings } = t`<div class:active="x${1}"></div>`;
		expect(() => getTemplate(strings)).toThrow(/exactly one interpolation/);
	});

	it('strips bound attributes from the parsed static markup, leaving unrelated static attributes', () => {
		const { strings } = t`<div id="static" class="${'x'}" data-x="${1}"></div>`;
		const { fragment } = instantiate(getTemplate(strings));
		const div = fragment.querySelector('div')!;
		expect(div.getAttribute('id')).toBe('static');
		expect(div.hasAttribute('class')).toBe(false);
		expect(div.hasAttribute('data-x')).toBe(false);
	});

	it('resolves descriptor order to match source order across mixed child/attribute bindings', () => {
		const { strings } = t`<div id="${'a'}">${'b'}<span class="${'c'}"></span></div>`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => p.kind)).toEqual(['attr', 'child', 'attr']);
	});

	it('supports multiple interpolations in one attribute value', () => {
		const { strings, values } = t`<div class="${'a'}-${'b'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({ kind: 'attr', name: 'class', valueCount: 2, literals: ['', '-', ''] });

		const { fragment, parts } = instantiate(template);
		updateParts(parts, values);
		expect(fragment.querySelector('div')!.getAttribute('class')).toBe('a-b');
	});

	it('supports mixing static text with a single interpolation in an attribute value', () => {
		const { strings, values } = t`<div class="static-${'x'}"></div>`;
		const { fragment, parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		expect(fragment.querySelector('div')!.getAttribute('class')).toBe('static-x');
	});

	it('resolves a multi-part attribute followed by another attribute, correctly splitting values', () => {
		const { strings, values } = t`<div class="${'a'} ${'b'}" id="${'c'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => [p.kind, p.name, p.valueCount])).toEqual([
			['attr', 'class', 2],
			['attr', 'id', 1],
		]);

		const { fragment, parts } = instantiate(template);
		updateParts(parts, values);
		const div = fragment.querySelector('div')!;
		expect(div.getAttribute('class')).toBe('a b');
		expect(div.getAttribute('id')).toBe('c');
	});

	it('resolves a multi-part attribute followed by child content, correctly splitting values', () => {
		const { strings, values } = t`<div class="${'a'} ${'b'}">${'c'}</div>`;
		const { fragment, parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		const div = fragment.querySelector('div')!;
		expect(div.getAttribute('class')).toBe('a b');
		// the ChildPart's text node sits right after its anchor comment
		expect(div.textContent).toBe('c');
	});

	it('throws when a `?`/`.`/`@`-prefixed binding has more than one interpolation', () => {
		expect(() => getTemplate(t`<input ?disabled="${true} ${false}"/>`.strings)).toThrow();
	});

	it('throws when a `?`/`.`/`@`-prefixed binding mixes in static text', () => {
		expect(() => getTemplate(t`<input ?disabled="x${true}"/>`.strings)).toThrow();
	});

	it('caches the compiled template per `strings` identity', () => {
		const { strings } = t`<p>${'x'}</p>`;
		expect(getTemplate(strings)).toBe(getTemplate(strings));
	});

	it('caches separately per template type (html vs svg) even for the same `strings`', () => {
		const { strings } = t`<x>${'x'}</x>`;
		expect(getTemplate(strings, 'html')).not.toBe(getTemplate(strings, 'svg'));
	});

	it('parses svg-type templates with their elements in the SVG namespace, without a leftover wrapper', () => {
		const { strings } = svg`<circle r="${3}" />`;
		const { fragment } = instantiate(getTemplate(strings, 'svg'));
		const circle = fragment.firstChild as Element;
		expect(circle.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(circle.tagName.toLowerCase()).toBe('circle');
	});

	it('instantiate() clones fresh, independent fragments/parts from the same compiled template', () => {
		const { strings } = t`<p>${'x'}</p>`;
		const template = getTemplate(strings);
		const first = instantiate(template);
		const second = instantiate(template);
		expect(first.fragment).not.toBe(second.fragment);
		expect(first.parts[0]).not.toBe(second.parts[0]);
	});
});
