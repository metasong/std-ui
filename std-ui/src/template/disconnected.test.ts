import { describe, expect, it } from 'vitest';
import { Directive, directive } from './directive.js';
import { AttributePart, ChildPart } from './parts/index.js';
import { t } from './html.js';

let log: string[] = [];
class Probe extends Directive {
	override render(_v: string) { return 'x'; }
	override disconnected() { log.push('disconnected'); }
}
const probe = directive(Probe);

function child() {
	const c = document.createElement('div');
	const a = document.createComment('');
	c.append(a);
	return { part: new ChildPart(a), c };
}

describe('Directive.disconnected', () => {
	it('is not called while the same directive keeps rendering', () => {
		log = [];
		const { part } = child();
		part.update([probe('a')]);
		part.update([probe('b')]);
		expect(log).toEqual([]);
	});
	it('runs when a plain value replaces the directive (child)', () => {
		log = [];
		const { part } = child();
		part.update([probe('a')]);
		part.update(['plain']);
		expect(log).toEqual(['disconnected']);
	});
	it('runs when a plain value replaces the directive (attribute)', () => {
		log = [];
		const part = new AttributePart(document.createElement('div'), 'title');
		part.update([probe('a')]);
		part.update(['plain']);
		expect(log).toEqual(['disconnected']);
	});
	it('runs when the enclosing template is replaced', () => {
		log = [];
		const { part } = child();
		part.update([t`<p>${probe('a')}</p>`]);
		part.update([t`<b>${'z'}</b>`]);
		expect(log).toEqual(['disconnected']);
	});
});
