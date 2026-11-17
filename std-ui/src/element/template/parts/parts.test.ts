import { describe, expect, it, vi } from 'vitest';
import {
	AttributePart,
	BooleanAttributePart,
	ChildPart,
	EventPart,
	PropertyPart,
} from './index.js';
import { t } from '../tag-funcs/html/index.js';
import { html } from '../directives/html/index.js';
import { Directive, directive, noChange, type Part } from '../directives/directive.js';
import { classMap } from '../directives/class-map/index.js';
import { styleMap } from '../directives/style-map/index.js';

describe('AttributePart', () => {
	it('sets the attribute as a string', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'id');
		part.update(['x']);
		expect(el.getAttribute('id')).toBe('x');
	});

	it('removes the attribute on null/undefined', () => {
		const el = document.createElement('div');
		el.setAttribute('id', 'x');
		const part = new AttributePart(el, 'id');
		part.update([null]);
		expect(el.hasAttribute('id')).toBe(false);
	});

	it('is a no-op (no DOM write) for an Object.is-equal value', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'id');
		part.update(['x']);
		const setAttribute = vi.spyOn(el, 'setAttribute');
		part.update(['x']);
		expect(setAttribute).not.toHaveBeenCalled();
	});

	it('composes multiple interpolations plus static text into one value', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class', ['a-', '-b-', '']);
		part.update(['x', 'y']);
		expect(el.getAttribute('class')).toBe('a-x-b-y');
	});

	it('treats a nullish value inside a multi-part attribute as empty text, not removal', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class', ['', ' ', '']);
		part.update(['a', null]);
		expect(el.getAttribute('class')).toBe('a ');
	});

	it('is a no-op for an Object.is-equal composed string across multi-part updates', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class', ['', ' ', '']);
		part.update(['a', 'b']);
		const setAttribute = vi.spyOn(el, 'setAttribute');
		part.update(['a', 'b']);
		expect(setAttribute).not.toHaveBeenCalled();
	});

	it('classMap(): toggles individual classes via classList instead of setAttribute', () => {
		const el = document.createElement('div');
		el.className = 'static-class';
		const part = new AttributePart(el, 'class');
		part.update([classMap({ active: true, hidden: false })]);
		expect(el.classList.contains('static-class')).toBe(true); // untouched
		expect(el.classList.contains('active')).toBe(true);
		expect(el.classList.contains('hidden')).toBe(false);
	});

	it('classMap(): removes classes that drop out or turn falsy on a later update', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'class');
		part.update([classMap({ active: true, selected: true })]);
		part.update([classMap({ active: false })]);
		expect(el.classList.contains('active')).toBe(false);
		expect(el.classList.contains('selected')).toBe(false);
	});

	it('styleMap(): sets individual inline style properties via el.style', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'style');
		part.update([styleMap({ color: 'red', fontSize: '12px' })]);
		expect(el.style.color).toBe('red');
		expect(el.style.fontSize).toBe('12px');
	});

	it('styleMap(): removes properties that drop out or go nullish on a later update', () => {
		const el = document.createElement('div');
		const part = new AttributePart(el, 'style');
		part.update([styleMap({ color: 'red', fontSize: '12px' })]);
		part.update([styleMap({ color: 'blue', fontSize: null })]);
		expect(el.style.color).toBe('blue');
		expect(el.style.fontSize).toBe('');
	});

	it('Directive protocol: dispatches to any custom directive without hardcoding its behavior, ' +
		'reusing the same instance (and thus its state) across updates at the same position', () => {
		class CountDirective extends Directive {
			#count = 0;
			override update(part: { element: Element; name: string }): typeof noChange {
				this.#count++;
				part.element.setAttribute(part.name, String(this.#count));
				return noChange;
			}
		}
		const countUpdates = directive(CountDirective);

		const el = document.createElement('div');
		const part = new AttributePart(el, 'data-count');
		part.update([countUpdates()]);
		part.update([countUpdates()]);
		expect(el.getAttribute('data-count')).toBe('2');
	});

	it("Directive protocol: constructs a fresh instance (losing prior state) when a different " +
		'directive function is bound at the same position', () => {
		class TagDirective extends Directive {
			override update(_part: Part, label: string): string {
				return label;
			}
		}
		const tagA = directive(class extends TagDirective {});
		const tagB = directive(class extends TagDirective {});

		const el = document.createElement('div');
		const part = new AttributePart(el, 'data-tag');
		part.update([tagA('a')]);
		part.update([tagB('b')]);
		expect(el.getAttribute('data-tag')).toBe('b');
	});

	it("Directive protocol: gives update() access to the live element/name via the Part argument", () => {
		class UppercaseDirective extends Directive {
			override update(part: { element: Element; name: string }, value: string): typeof noChange {
				part.element.setAttribute(part.name, value.toUpperCase());
				return noChange;
			}
		}
		const upper = directive(UppercaseDirective);

		const el = document.createElement('div');
		const part = new AttributePart(el, 'data-label');
		part.update([upper('hi')]);
		expect(el.getAttribute('data-label')).toBe('HI');
	});
});

describe('BooleanAttributePart', () => {
	it('toggles the attribute based on truthiness', () => {
		const el = document.createElement('div');
		const part = new BooleanAttributePart(el, 'hidden');
		part.update([true]);
		expect(el.hasAttribute('hidden')).toBe(true);
		part.update([false]);
		expect(el.hasAttribute('hidden')).toBe(false);
	});

	it('is a no-op for an Object.is-equal value', () => {
		const el = document.createElement('div');
		const part = new BooleanAttributePart(el, 'hidden');
		part.update([true]);
		const toggleAttribute = vi.spyOn(el, 'toggleAttribute');
		part.update([true]);
		expect(toggleAttribute).not.toHaveBeenCalled();
	});
});

describe('PropertyPart', () => {
	it('assigns the JS property directly (not an HTML attribute)', () => {
		const el = document.createElement('input');
		const part = new PropertyPart(el, 'value');
		part.update(['hello']);
		expect(el.value).toBe('hello');
		expect(el.hasAttribute('value')).toBe(false);
	});
});

describe('EventPart filters', () => {
	it('applies prevent/stop and skips handler for .self on child targets', () => {
		const parent = document.createElement('div');
		const child = document.createElement('span');
		parent.append(child);
		const handler = vi.fn();
		new EventPart(parent, 'click', [{ name: 'prevent' }, { name: 'stop' }, { name: 'self' }]).update([handler]);

		const own = new Event('click', { cancelable: true, bubbles: true });
		parent.dispatchEvent(own);
		expect(handler).toHaveBeenCalledTimes(1);
		expect(own.defaultPrevented).toBe(true);

		child.dispatchEvent(new Event('click', { bubbles: true }));
		expect(handler).toHaveBeenCalledTimes(1);
	});
});

describe('EventPart stop-immediate', () => {
	it('blocks later listeners on the same element', () => {
		const el = document.createElement('div');
		const later = vi.fn();
		const handler = vi.fn();
		new EventPart(el, 'click', [{ name: 'stop-immediate' }]).update([handler]);
		el.addEventListener('click', later);
		el.dispatchEvent(new Event('click'));
		expect(handler).toHaveBeenCalledTimes(1);
		expect(later).not.toHaveBeenCalled();
	});
});

describe('EventPart', () => {
	it('adds the listener and invokes it on dispatch', () => {
		const el = document.createElement('button');
		const part = new EventPart(el, 'click');
		const handler = vi.fn();
		part.update([handler]);
		el.dispatchEvent(new Event('click'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('swaps the listener when updated with a different function', () => {
		const el = document.createElement('button');
		const part = new EventPart(el, 'click');
		const first = vi.fn();
		const second = vi.fn();
		part.update([first]);
		part.update([second]);
		el.dispatchEvent(new Event('click'));
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('removes the listener when updated with a non-function value', () => {
		const el = document.createElement('button');
		const part = new EventPart(el, 'click');
		const handler = vi.fn();
		part.update([handler]);
		part.update([undefined]);
		el.dispatchEvent(new Event('click'));
		expect(handler).not.toHaveBeenCalled();
	});

	it('passes options (e.g. capture/once/passive) through to add/removeEventListener', () => {
		const el = document.createElement('button');
		const addEventListener = vi.spyOn(el, 'addEventListener');
		const removeEventListener = vi.spyOn(el, 'removeEventListener');
		const options = { once: true, capture: true, passive: true };
		const part = new EventPart(el, 'click', [{ name: 'once' }, { name: 'capture' }, { name: 'passive' }]);
		const first = vi.fn();
		part.update([first]);
		expect(addEventListener).toHaveBeenCalledWith('click', part, options);

		// Swapping handlers keeps the one registered listener (the part itself).
		const second = vi.fn();
		part.update([second]);
		expect(addEventListener).toHaveBeenCalledTimes(1);
		part.update([undefined]);
		expect(removeEventListener).toHaveBeenCalledWith('click', part, options);
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

	it('honors the `once` option: handler fires once then self-removes', () => {
		const el = document.createElement('button');
		const part = new EventPart(el, 'click', [{ name: 'once' }]);
		const handler = vi.fn();
		part.update([handler]);
		el.dispatchEvent(new Event('click'));
		el.dispatchEvent(new Event('click'));
		expect(handler).toHaveBeenCalledTimes(1);
	});
});

describe('ChildPart', () => {
	function makePart(): { part: ChildPart; container: HTMLElement; anchor: Comment } {
		const container = document.createElement('div');
		const anchor = document.createComment('std-ui-part');
		container.appendChild(anchor);
		return { part: new ChildPart(anchor), container, anchor };
	}

	it('renders strings/numbers as text nodes', () => {
		const { part, container } = makePart();
		part.update(['hello']);
		expect(container.textContent).toBe('hello');
		part.update([42]);
		expect(container.textContent).toBe('42');
	});

	it('renders null/undefined/false as nothing, clearing any previous content', () => {
		const { part, container } = makePart();
		part.update(['hello']);
		part.update([null]);
		expect(container.textContent).toBe('');
		part.update(['hello']);
		part.update([undefined]);
		expect(container.textContent).toBe('');
		part.update(['hello']);
		part.update([false]);
		expect(container.textContent).toBe('');
	});

	it('renders a nested t() result and patches it in place on same-strings re-updates', () => {
		const { part, container } = makePart();
		const view = (name: string) => t`<b>${name}</b>`;
		part.update([view('Ada')]);
		expect(container.querySelector('b')!.textContent).toBe('Ada');

		part.update([view('Grace')]);
		expect(container.querySelectorAll('b')).toHaveLength(1); // same DOM reused, not rebuilt
		expect(container.querySelector('b')!.textContent).toBe('Grace');
	});

	it('tears down and rebuilds when switching to a different template literal', () => {
		const { part, container } = makePart();
		part.update([t`<b>${'x'}</b>`]);
		const firstB = container.querySelector('b');
		part.update([t`<i>${'x'}</i>`]);
		expect(container.querySelector('b')).toBeNull();
		expect(container.querySelector('i')).not.toBeNull();
		expect(container.querySelector('i')).not.toBe(firstB);
	});

	it('renders html markup as real parsed nodes', () => {
		const { part, container } = makePart();
		part.update([html('<em>hi</em>')]);
		expect(container.querySelector('em')!.textContent).toBe('hi');
	});

	it('renders an array of values as sibling nodes, diffed positionally', () => {
		const { part, container } = makePart();
		part.update([['a', 'b', 'c']]);
		expect(container.textContent).toBe('abc');

		part.update([['a', 'z']]); // shrink: drops the extra trailing item
		expect(container.textContent).toBe('az');

		part.update([['a', 'z', 'c']]); // grow back
		expect(container.textContent).toBe('azc');
	});

	it('renders an array of nested templates, each independently diffed', () => {
		const { part, container } = makePart();
		const item = (label: string) => t`<li>${label}</li>`;
		part.update([[item('one'), item('two')]]);
		expect(Array.from(container.querySelectorAll('li')).map(li => li.textContent)).toEqual(['one', 'two']);

		part.update([[item('ONE'), item('two')]]);
		expect(Array.from(container.querySelectorAll('li')).map(li => li.textContent)).toEqual(['ONE', 'two']);
	});
});
