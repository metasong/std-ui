import { describe, expect, it } from 'vitest';
import { getTemplate, instantiate } from './compile.js';
import { html, svg } from './html.js';
import { updateParts } from './parts/index.js';

describe('getTemplate/instantiate', () => {
	it('compiles a child binding to a comment-anchored ChildPart', () => {
		const { strings } = html`<p>Hello, ${'Ada'}!</p>`;
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
		const { strings } = html`<div id="${'x'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({ kind: 'attr', name: 'id' });
		// the marker attribute is stripped out of the parsed template entirely
		const { fragment } = instantiate(template);
		expect(fragment.querySelector('div')!.hasAttribute('id')).toBe(false);
	});

	it('recognizes ?/./@-prefixed bindings as bool/prop/event kinds', () => {
		const { strings } = html`<input ?disabled="${true}" .value="${'v'}" @click="${() => {}}" />`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => [p.kind, p.name])).toEqual([
			['bool', 'disabled'],
			['prop', 'value'],
			['event', 'click'],
		]);
	});

	it('parses `.modifier`s off an `@`-prefixed event binding into AddEventListenerOptions', () => {
		const { strings } = html`<button @click.once.capture.passive="${() => {}}"></button>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({
			kind: 'event',
			name: 'click',
			options: { once: true, capture: true, passive: true },
		});
	});

	it('ignores unknown modifiers on an event binding', () => {
		const { strings } = html`<button @click.bogus="${() => {}}"></button>`;
		const template = getTemplate(strings);
		expect(template.parts[0]).toMatchObject({ kind: 'event', name: 'click', options: {} });
	});

	it('strips bound attributes from the parsed static markup, leaving unrelated static attributes', () => {
		const { strings } = html`<div id="static" class="${'x'}" data-x="${1}"></div>`;
		const { fragment } = instantiate(getTemplate(strings));
		const div = fragment.querySelector('div')!;
		expect(div.getAttribute('id')).toBe('static');
		expect(div.hasAttribute('class')).toBe(false);
		expect(div.hasAttribute('data-x')).toBe(false);
	});

	it('resolves descriptor order to match source order across mixed child/attribute bindings', () => {
		const { strings } = html`<div id="${'a'}">${'b'}<span class="${'c'}"></span></div>`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => p.kind)).toEqual(['attr', 'child', 'attr']);
	});

	it('supports multiple interpolations in one attribute value', () => {
		const { strings, values } = html`<div class="${'a'}-${'b'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({ kind: 'attr', name: 'class', valueCount: 2, literals: ['', '-', ''] });

		const { fragment, parts } = instantiate(template);
		updateParts(parts, values);
		expect(fragment.querySelector('div')!.getAttribute('class')).toBe('a-b');
	});

	it('supports mixing static text with a single interpolation in an attribute value', () => {
		const { strings, values } = html`<div class="static-${'x'}"></div>`;
		const { fragment, parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		expect(fragment.querySelector('div')!.getAttribute('class')).toBe('static-x');
	});

	it('resolves a multi-part attribute followed by another attribute, correctly splitting values', () => {
		const { strings, values } = html`<div class="${'a'} ${'b'}" id="${'c'}"></div>`;
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
		const { strings, values } = html`<div class="${'a'} ${'b'}">${'c'}</div>`;
		const { fragment, parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		const div = fragment.querySelector('div')!;
		expect(div.getAttribute('class')).toBe('a b');
		// the ChildPart's text node sits right after its anchor comment
		expect(div.textContent).toBe('c');
	});

	it('throws when a `?`/`.`/`@`-prefixed binding has more than one interpolation', () => {
		expect(() => getTemplate(html`<input ?disabled="${true} ${false}"/>`.strings)).toThrow();
	});

	it('throws when a `?`/`.`/`@`-prefixed binding mixes in static text', () => {
		expect(() => getTemplate(html`<input ?disabled="x${true}"/>`.strings)).toThrow();
	});

	it('caches the compiled template per `strings` identity', () => {
		const { strings } = html`<p>${'x'}</p>`;
		expect(getTemplate(strings)).toBe(getTemplate(strings));
	});

	it('caches separately per template type (html vs svg) even for the same `strings`', () => {
		const { strings } = html`<x>${'x'}</x>`;
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
		const { strings } = html`<p>${'x'}</p>`;
		const template = getTemplate(strings);
		const first = instantiate(template);
		const second = instantiate(template);
		expect(first.fragment).not.toBe(second.fragment);
		expect(first.parts[0]).not.toBe(second.parts[0]);
	});
});
