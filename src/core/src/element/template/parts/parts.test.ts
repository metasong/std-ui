import { describe, expect, it, vi } from 'vitest';
import {
	AttributePart,
	BooleanAttributePart,
	ChildPart,
	EventPart,
	PropertyPart,
} from './index.js';
import { t } from '../tag-funcs/html/index.js';
import { unsafeHtml } from '../directives/html/index.js';
import { Directive, directive, noChange, type DirectivePart } from '../directives/directive.js';
import { classMap } from '../directives/class-map/index.js';
import { styleMap } from '../directives/style-map/index.js';

describe('AttributePart', () => {
	it('sets the attribute as a string', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'id');
		DirectivePart.update(['x']);
		expect(el.getAttribute('id')).toBe('x');
	});

	it('removes the attribute on null/undefined', () => {
		const el = document.createElement('div');
		el.setAttribute('id', 'x');
		const DirectivePart = new AttributePart(el, 'id');
		DirectivePart.update([null]);
		expect(el.hasAttribute('id')).toBe(false);
	});

	it('is a no-op (no DOM write) for an Object.is-equal value', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'id');
		DirectivePart.update(['x']);
		const setAttribute = vi.spyOn(el, 'setAttribute');
		DirectivePart.update(['x']);
		expect(setAttribute).not.toHaveBeenCalled();
	});

	it('composes multiple interpolations plus static text into one value', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'class', ['a-', '-b-', '']);
		DirectivePart.update(['x', 'y']);
		expect(el.getAttribute('class')).toBe('a-x-b-y');
	});

	it('treats a nullish value inside a multi-DirectivePart attribute as empty text, not removal', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'class', ['', ' ', '']);
		DirectivePart.update(['a', null]);
		expect(el.getAttribute('class')).toBe('a ');
	});

	it('is a no-op for an Object.is-equal composed string across multi-DirectivePart updates', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'class', ['', ' ', '']);
		DirectivePart.update(['a', 'b']);
		const setAttribute = vi.spyOn(el, 'setAttribute');
		DirectivePart.update(['a', 'b']);
		expect(setAttribute).not.toHaveBeenCalled();
	});

	it('classMap(): toggles individual classes via classList instead of setAttribute', () => {
		const el = document.createElement('div');
		el.className = 'static-class';
		const DirectivePart = new AttributePart(el, 'class');
		DirectivePart.update([classMap({ active: true, hidden: false })]);
		expect(el.classList.contains('static-class')).toBe(true); // untouched
		expect(el.classList.contains('active')).toBe(true);
		expect(el.classList.contains('hidden')).toBe(false);
	});

	it('classMap(): removes classes that drop out or turn falsy on a later update', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'class');
		DirectivePart.update([classMap({ active: true, selected: true })]);
		DirectivePart.update([classMap({ active: false })]);
		expect(el.classList.contains('active')).toBe(false);
		expect(el.classList.contains('selected')).toBe(false);
	});

	it('styleMap(): sets individual inline style properties via el.style', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'style');
		DirectivePart.update([styleMap({ color: 'red', fontSize: '12px' })]);
		expect(el.style.color).toBe('red');
		expect(el.style.fontSize).toBe('12px');
	});

	it('styleMap(): removes properties that drop out or go nullish on a later update', () => {
		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'style');
		DirectivePart.update([styleMap({ color: 'red', fontSize: '12px' })]);
		DirectivePart.update([styleMap({ color: 'blue', fontSize: null })]);
		expect(el.style.color).toBe('blue');
		expect(el.style.fontSize).toBe('');
	});

	it('Directive protocol: dispatches to any custom directive without hardcoding its behavior, ' +
		'reusing the same instance (and thus its state) across updates at the same position', () => {
		class CountDirective extends Directive {
			#count = 0;
			override update(DirectivePart: DirectivePart & { element: Element; name: string }): typeof noChange {
				this.#count++;
				DirectivePart.element.setAttribute(DirectivePart.name, String(this.#count));
				return noChange;
			}
		}
		const countUpdates = directive(CountDirective);

		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'data-count');
		DirectivePart.update([countUpdates()]);
		DirectivePart.update([countUpdates()]);
		expect(el.getAttribute('data-count')).toBe('2');
	});

	it("Directive protocol: constructs a fresh instance (losing prior state) when a different " +
		'directive function is bound at the same position', () => {
		class TagDirective extends Directive {
			override update(_part: DirectivePart, label: string): string {
				return label;
			}
		}
		const tagA = directive(class extends TagDirective {});
		const tagB = directive(class extends TagDirective {});

		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'data-tag');
		DirectivePart.update([tagA('a')]);
		DirectivePart.update([tagB('b')]);
		expect(el.getAttribute('data-tag')).toBe('b');
	});

	it("Directive protocol: gives update() access to the live element/name via the DirectivePart argument", () => {
		class UppercaseDirective extends Directive {
			override update(DirectivePart: DirectivePart & { element: Element; name: string }, value: string): typeof noChange {
				DirectivePart.element.setAttribute(DirectivePart.name, value.toUpperCase());
				return noChange;
			}
		}
		const upper = directive(UppercaseDirective);

		const el = document.createElement('div');
		const DirectivePart = new AttributePart(el, 'data-label');
		DirectivePart.update([upper('hi')]);
		expect(el.getAttribute('data-label')).toBe('HI');
	});
});

describe('BooleanAttributePart', () => {
	it('toggles the attribute based on truthiness', () => {
		const el = document.createElement('div');
		const DirectivePart = new BooleanAttributePart(el, 'hidden');
		DirectivePart.update([true]);
		expect(el.hasAttribute('hidden')).toBe(true);
		DirectivePart.update([false]);
		expect(el.hasAttribute('hidden')).toBe(false);
	});

	it('is a no-op for an Object.is-equal value', () => {
		const el = document.createElement('div');
		const DirectivePart = new BooleanAttributePart(el, 'hidden');
		DirectivePart.update([true]);
		const toggleAttribute = vi.spyOn(el, 'toggleAttribute');
		DirectivePart.update([true]);
		expect(toggleAttribute).not.toHaveBeenCalled();
	});
});

describe('PropertyPart', () => {
	it('assigns the JS property directly (not an HTML attribute)', () => {
		const el = document.createElement('input');
		const DirectivePart = new PropertyPart(el, 'value');
		DirectivePart.update(['hello']);
		expect(el.value).toBe('hello');
		expect(el.hasAttribute('value')).toBe(false);
	});
});

describe('EventPart', () => {
	it('adds the listener and invokes it on dispatch', () => {
		const el = document.createElement('button');
		const DirectivePart = new EventPart(el, 'click');
		const handler = vi.fn();
		DirectivePart.update([handler]);
		el.dispatchEvent(new Event('click'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('swaps the listener when updated with a different function', () => {
		const el = document.createElement('button');
		const DirectivePart = new EventPart(el, 'click');
		const first = vi.fn();
		const second = vi.fn();
		DirectivePart.update([first]);
		DirectivePart.update([second]);
		el.dispatchEvent(new Event('click'));
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('removes the listener when updated with a non-function value', () => {
		const el = document.createElement('button');
		const DirectivePart = new EventPart(el, 'click');
		const handler = vi.fn();
		DirectivePart.update([handler]);
		DirectivePart.update([undefined]);
		el.dispatchEvent(new Event('click'));
		expect(handler).not.toHaveBeenCalled();
	});
	it('calls handlers with `this` = host (or the element when no host)', () => {
		const el = document.createElement('button');
		const host = {};
		let seen: unknown;
		const handler = function (this: unknown) { seen = this; };
		const withHost = new EventPart(el, 'click', undefined, host);
		withHost.update([handler]);
		el.dispatchEvent(new Event('click'));
		expect(seen).toBe(host);

		const el2 = document.createElement('button');
		new EventPart(el2, 'click').update([handler]);
		el2.dispatchEvent(new Event('click'));
		expect(seen).toBe(el2);
	});
});

describe('ChildPart', () => {
	function makePart(): { DirectivePart: ChildPart; container: HTMLElement; anchor: Comment } {
		const container = document.createElement('div');
		const anchor = document.createComment('std-ui-DirectivePart');
		container.appendChild(anchor);
		return { DirectivePart: new ChildPart(anchor), container, anchor };
	}

	it('renders strings/numbers as text nodes', () => {
		const { DirectivePart, container } = makePart();
		DirectivePart.update(['hello']);
		expect(container.textContent).toBe('hello');
		DirectivePart.update([42]);
		expect(container.textContent).toBe('42');
	});

	it('renders null/undefined/false as nothing, clearing any previous content', () => {
		const { DirectivePart, container } = makePart();
		DirectivePart.update(['hello']);
		DirectivePart.update([null]);
		expect(container.textContent).toBe('');
		DirectivePart.update(['hello']);
		DirectivePart.update([undefined]);
		expect(container.textContent).toBe('');
		DirectivePart.update(['hello']);
		DirectivePart.update([false]);
		expect(container.textContent).toBe('');
	});

	it('renders a nested t() result and patches it in place on same-strings re-updates', () => {
		const { DirectivePart, container } = makePart();
		const view = (name: string) => t`<b>${name}</b>`;
		DirectivePart.update([view('Ada')]);
		expect(container.querySelector('b')!.textContent).toBe('Ada');

		DirectivePart.update([view('Grace')]);
		expect(container.querySelectorAll('b')).toHaveLength(1); // same DOM reused, not rebuilt
		expect(container.querySelector('b')!.textContent).toBe('Grace');
	});

	it('tears down and rebuilds when switching to a different template literal', () => {
		const { DirectivePart, container } = makePart();
		DirectivePart.update([t`<b>${'x'}</b>`]);
		const firstB = container.querySelector('b');
		DirectivePart.update([t`<i>${'x'}</i>`]);
		expect(container.querySelector('b')).toBeNull();
		expect(container.querySelector('i')).not.toBeNull();
		expect(container.querySelector('i')).not.toBe(firstB);
	});

	it('renders html markup as real parsed nodes', () => {
		const { DirectivePart, container } = makePart();
		DirectivePart.update([unsafeHtml('<em>hi</em>')]);
		expect(container.querySelector('em')!.textContent).toBe('hi');
	});

	it('renders an array of values as sibling nodes, diffed positionally', () => {
		const { DirectivePart, container } = makePart();
		DirectivePart.update([['a', 'b', 'c']]);
		expect(container.textContent).toBe('abc');

		DirectivePart.update([['a', 'z']]); // shrink: drops the extra trailing item
		expect(container.textContent).toBe('az');

		DirectivePart.update([['a', 'z', 'c']]); // grow back
		expect(container.textContent).toBe('azc');
	});

	it('renders an array of nested templates, each independently diffed', () => {
		const { DirectivePart, container } = makePart();
		const item = (label: string) => t`<li>${label}</li>`;
		DirectivePart.update([[item('one'), item('two')]]);
		expect(Array.from(container.querySelectorAll('li')).map(li => li.textContent)).toEqual(['one', 'two']);

		DirectivePart.update([[item('ONE'), item('two')]]);
		expect(Array.from(container.querySelectorAll('li')).map(li => li.textContent)).toEqual(['ONE', 'two']);
	});
});
