import { describe, expect, it, vi } from 'vitest';
import { getTemplate, instantiate } from './factory.js';
import { t, svg, math } from '../tag-funcs/html/index.js';
import { updateParts, BooleanAttributePart, PropertyPart, EventPart } from '../parts/index.js';
import { render } from '../render.js';
import { registerCustomAttribute } from './custom-attribute.js';

describe('getTemplate/instantiate', () => {
	it('builds a child binding to a comment-anchored ChildPart', () => {
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

	it('builds a plain attribute binding', () => {
		const { strings } = t`<div id="${'x'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({ kind: 'attribute', name: 'id' });
		// the marker attribute is stripped out of the parsed template entirely
		const { fragment } = instantiate(template);
		expect(fragment.querySelector('div')!.hasAttribute('id')).toBe(false);
	});

	it('recognizes ?/./@-prefixed bindings as bool/prop/event kinds', () => {
		const { strings } = t`<input ?disabled="${true}" .value="${'v'}" @click="${() => {}}" />`;
		const template = getTemplate(strings);
		expect(template.parts.map(p => p.name)).toEqual(['disabled', 'value', 'click']);
		const { parts } = instantiate(template);
		expect(parts[0]).toBeInstanceOf(BooleanAttributePart);
		expect(parts[1]).toBeInstanceOf(PropertyPart);
		expect(parts[2]).toBeInstanceOf(EventPart);
	});

	it('keeps `.modifier`s on an `@`-prefixed event binding, in source order', () => {
		const { strings } = t`<button @click.once.capture.passive="${() => {}}"></button>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({
			name: 'click',
			modifiers: [{ name: 'once' }, { name: 'capture' }, { name: 'passive' }],
		});
	});

	it('leaves event modifiers to `@std-ui/ext`: core ignores `.once`/`.prevent`/`.stop`', () => {
		const handler = vi.fn();
		const { strings, values } = t`<form @submit.prevent.stop.once="${handler}"></form>`;
		const { fragment, parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		const form = fragment.querySelector('form')!;

		const first = new Event('submit', { cancelable: true });
		form.dispatchEvent(first);
		form.dispatchEvent(new Event('submit', { cancelable: true }));
		expect(first.defaultPrevented).toBe(false);
		expect(handler).toHaveBeenCalledTimes(2);
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

	it('parses `:value` on modifiers', () => {
		const { strings } = t`<input @input.bogus:300="${() => {}}" />`;
		expect(getTemplate(strings).parts[0].modifiers).toEqual([{ name: 'bogus', value: '300' }]);
	});

	it('reserves `:arg` on binding names', () => {
		const { strings } = t`<div foo:bar="${1}"></div>`;
		expect(() => getTemplate(strings)).toThrow(/:arg/);
	});

	it('registers custom Custom attributes', () => {
		const seen: unknown[] = [];
		registerCustomAttribute({
			sigil: '', name: 'tmpext',
			createPart: (_el, attributeInfo) => ({ valueCount: 1, update: v => seen.push([attributeInfo.arg, attributeInfo.modifiers, v[0]]) }),
		});
		const { strings, values } = t`<div tmpext:a.m:1=${5}></div>`;
		const { parts } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		expect(seen).toEqual([['a', [{ name: 'm', value: '1' }], 5]]);
	});

	it('supports a new sigil with arg, modifiers and a composed value', () => {
		const seen: unknown[] = [];
		registerCustomAttribute({
			sigil: '#', name: 'tag',
			createPart: (_el, attributeInfo, _host, v) => ({
				valueCount: v.valueCount,
				update: vals => seen.push([attributeInfo.arg, attributeInfo.modifiers, v.literals, vals]),
			}),
		});
		const { strings, values } = t`<div #tag:a.m:1="abc ${'x'} d ${'y'}"></div>`;
		const { parts, fragment } = instantiate(getTemplate(strings));
		updateParts(parts, values);
		expect(seen).toEqual([['a', [{ name: 'm', value: '1' }], ['abc ', ' d ', ''], ['x', 'y']]]);
		expect(fragment.querySelector('div')!.attributes.length).toBe(0);
	});

	it('rejects an unknown sigil', () => {
		const { strings } = t`<div %nope="${1}"></div>`;
		expect(() => getTemplate(strings)).toThrow(/unknown binding sigil/);
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
		expect(template.parts.map(p => p.kind)).toEqual(['attribute', 'child', 'attribute']);
	});

	it('supports multiple interpolations in one attribute value', () => {
		const { strings, values } = t`<div class="${'a'}-${'b'}"></div>`;
		const template = getTemplate(strings);
		expect(template.parts).toHaveLength(1);
		expect(template.parts[0]).toMatchObject({ kind: 'attribute', name: 'class', valueCount: 2, literals: ['', '-', ''] });

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
			['attribute', 'class', 2],
			['attribute', 'id', 1],
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

	it('caches the built template per `strings` identity', () => {
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

	it('plain `t` does NOT put a bare <circle> fragment in the SVG namespace (why `svg` exists)', () => {
		const { strings } = t`<circle r="${3}"></circle>`;
		const { fragment } = instantiate(getTemplate(strings));
		const circle = fragment.firstChild as Element;
		expect(circle.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
		expect(circle instanceof SVGElement).toBe(false);

		// moving it into a real <svg> afterwards does not fix it
		const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		host.appendChild(circle);
		expect(circle.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
	});

	it('renders plain-`t` <circle> fragments embedded in <svg>: are they real SVG elements?', () => {
		const a = t`<circle r="1"></circle>`;
		const container = document.createElement('div');
		render(t`<svg>${[1, 2, 3].map(() => a)}</svg>`, container);

		const circles = container.querySelectorAll('circle');
		expect(circles).toHaveLength(3);
		for (const c of circles) {
			expect(c.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
			expect(c instanceof SVGElement).toBe(false);
		}
	});

	it('renders `svg` <circle> fragments embedded in <svg> as real SVG elements', () => {
		const a = svg`<circle r="1"></circle>`;
		const container = document.createElement('div');
		render(t`<svg>${[1, 2, 3].map(() => a)}</svg>`, container);

		const circles = container.querySelectorAll('circle');
		expect(circles).toHaveLength(3);
		for (const c of circles) expect(c.namespaceURI).toBe('http://www.w3.org/2000/svg');
	});

	it('renders un-wrapped plain-`t` <circle> fragments as HTMLUnknownElement in the xhtml namespace', () => {
		const a = t`<circle r="1"></circle>`;
		const container = document.createElement('div');
		render(t`<svg>${[1, 2, 3].map(() => a)}</svg>`, container);

		const circles = [...container.querySelectorAll('circle')];
		expect(circles.map((c) => c.constructor.name)).toEqual([
			'HTMLUnknownElement',
			'HTMLUnknownElement',
			'HTMLUnknownElement',
		]);
		expect(circles.map((c) => c.namespaceURI)).toEqual(Array(3).fill('http://www.w3.org/1999/xhtml'));
	});

	it('renders `math` fragments in the MathML namespace; plain `t` fragments are HTMLUnknownElement', () => {
		const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';
		const plain = t`<mi>x</mi>`;
		const mathFragment = math`<mi>x</mi>`;

		const plainContainer = document.createElement('div');
		render(t`<math>${plain}</math>`, plainContainer);
		const plainMi = plainContainer.querySelector('mi')!;
		expect(plainMi.namespaceURI).toBe('http://www.w3.org/1999/xhtml');

		const mathContainer = document.createElement('div');
		render(t`<math>${mathFragment}</math>`, mathContainer);
		const mathMi = mathContainer.querySelector('mi')!;
		expect(mathMi.namespaceURI).toBe(MATHML_NS);
		expect(mathContainer.querySelectorAll('math math')).toHaveLength(0); // wrapper removed
	});

	it('renders plain-`t` fragments that carry their own <svg> wrapper (nested <svg>) as real SVG elements', () => {
		const a = t`<svg><circle r="1"></circle></svg>`;
		const container = document.createElement('div');
		render(t`<svg>${[1, 2, 3].map(() => a)}</svg>`, container);

		const circles = container.querySelectorAll('circle');
		expect(circles).toHaveLength(3);
		for (const c of circles) {
			expect(c.namespaceURI).toBe('http://www.w3.org/2000/svg');
			expect(c instanceof SVGElement).toBe(true);
		}
		expect(container.querySelectorAll('svg svg')).toHaveLength(3);
	});

	it('instantiate() clones fresh, independent fragments/parts from the same built template', () => {
		const { strings } = t`<p>${'x'}</p>`;
		const template = getTemplate(strings);
		const first = instantiate(template);
		const second = instantiate(template);
		expect(first.fragment).not.toBe(second.fragment);
		expect(first.parts[0]).not.toBe(second.parts[0]);
	});
});
