import { describe, expect, it } from 'vitest';
import { Directive, directive, type DirectivePart } from './directive.js';
import { AttributePart, ChildPart } from '../parts/index.js';
import { t } from '../tag-funcs/html/index.js';

let log: string[] = [];
class Probe extends Directive {
	override update(_part: DirectivePart, _v: string) { return 'x'; }
	override disconnected() { log.push('disconnected'); }
}
const probe = directive(Probe);

function child() {
	const c = document.createElement('div');
	const a = document.createComment('');
	c.append(a);
	return { DirectivePart: new ChildPart(a), c };
}

describe('Directive.disconnected', () => {
	it('is not called while the same directive keeps rendering', () => {
		log = [];
		const { DirectivePart } = child();
		DirectivePart.update([probe('a')]);
		DirectivePart.update([probe('b')]);
		expect(log).toEqual([]);
	});
	it('runs when a plain value replaces the directive (child)', () => {
		log = [];
		const { DirectivePart } = child();
		DirectivePart.update([probe('a')]);
		DirectivePart.update(['plain']);
		expect(log).toEqual(['disconnected']);
	});
	it('runs when a plain value replaces the directive (attribute)', () => {
		log = [];
		const DirectivePart = new AttributePart(document.createElement('div'), 'title');
		DirectivePart.update([probe('a')]);
		DirectivePart.update(['plain']);
		expect(log).toEqual(['disconnected']);
	});
	it('runs when the enclosing template is replaced', () => {
		log = [];
		const { DirectivePart } = child();
		DirectivePart.update([t`<p>${probe('a')}</p>`]);
		DirectivePart.update([t`<b>${'z'}</b>`]);
		expect(log).toEqual(['disconnected']);
	});
});
