import { describe, expect, it } from 'vitest';
import { Directive, applyDirective, directive, isDirectiveResult, noChange, type Part } from './directive.js';
import { PartType } from '../parts/part.js';

function attributePart(el: Element, name: string): Part {
	return { type: PartType.ATTRIBUTE, element: el, name };
}

class EchoDirective extends Directive {
	renderCalls: unknown[][] = [];
	override update(_part: Part, ...args: unknown[]): string {
		this.renderCalls.push(args);
		return String(args[0]);
	}
}
const echo = directive(EchoDirective);

describe('directive()', () => {
	it('returns an inert DirectiveResult, doing no DOM work until applied', () => {
		const el = document.createElement('div');
		const result = echo('hi');
		expect(el.hasAttribute('title')).toBe(false);
		expect(isDirectiveResult(result)).toBe(true);
	});

	it('is false for plain values', () => {
		expect(isDirectiveResult('hi')).toBe(false);
		expect(isDirectiveResult(42)).toBe(false);
		expect(isDirectiveResult(null)).toBe(false);
		expect(isDirectiveResult({})).toBe(false);
	});
});

describe('Directive update() return value', () => {
	it('returns update() raw value for the part to commit', () => {
		const el = document.createElement('div');
		const { value } = applyDirective(attributePart(el, 'title'), echo('hi'), undefined);
		expect(value).toBe('hi');
	});
});

describe('applyDirective()', () => {
	it('constructs a new instance on first use and calls update()', () => {
		const el = document.createElement('div');
		const { instance } = applyDirective(attributePart(el, 'title'), echo('hi'), undefined);
		expect((instance as EchoDirective).renderCalls).toEqual([['hi']]);
	});

	it('reuses the previous instance (same state) when the same directive function is used again', () => {
		const el = document.createElement('div');
		const part = attributePart(el, 'title');
		const first = applyDirective(part, echo('a'), undefined).instance as EchoDirective;
		const second = applyDirective(part, echo('b'), first).instance as EchoDirective;
		expect(second).toBe(first);
		expect(second.renderCalls).toEqual([['a'], ['b']]);
	});

	it('constructs a fresh instance when a different directive function is bound at the same position', () => {
		const otherEcho = directive(class extends EchoDirective {});
		const el = document.createElement('div');
		const part = attributePart(el, 'title');
		const first = applyDirective(part, echo('a'), undefined).instance;
		const second = applyDirective(part, otherEcho('b'), first).instance;
		expect(second).not.toBe(first);
	});

	it("threads a directive overriding update() straight through, using part.element", () => {
		class ImperativeDirective extends Directive {
			override update(part: Part, label: string): typeof noChange {
				part.element.setAttribute(part.name, `imperative:${label}`);
				return noChange;
			}
		}
		const imperative = directive(ImperativeDirective);
		const el = document.createElement('div');
		const { value } = applyDirective(attributePart(el, 'title'), imperative('x'), undefined);
		expect(value).toBe(noChange);
		expect(el.getAttribute('title')).toBe('imperative:x');
	});

	it('threads multiple real trailing update() parameters through individually, not as one bundled array', () => {
		class ConcatDirective extends Directive {
			override update(part: Part, a: string, b: number): typeof noChange {
				part.element.setAttribute(part.name, `${a}-${b}`);
				return noChange;
			}
		}
		const concat = directive(ConcatDirective);
		const el = document.createElement('div');
		applyDirective(attributePart(el, 'title'), concat('x', 1), undefined);
		expect(el.getAttribute('title')).toBe('x-1');
	});

	it("runs the directive's constructor validation only on first construction at a position", () => {
		class StrictDirective extends Directive {
			constructor(partInfo: Part) {
				super(partInfo);
				if (partInfo.name !== 'class') throw new Error('must be "class"');
			}
			override update(_part: Part): string {
				return 'ok';
			}
		}
		const strict = directive(StrictDirective);
		const el = document.createElement('div');
		expect(() => applyDirective(attributePart(el, 'id'), strict(), undefined)).toThrow('must be "class"');
		expect(() => applyDirective(attributePart(el, 'class'), strict(), undefined)).not.toThrow();
	});
});
