import { describe, expect, it } from 'vitest';
import { Directive, directive } from '../directives/directive.js';
import { t } from './index.js';
import { render, unmount } from './render.js';

let log: string[] = [];
class Probe extends Directive {
	override render(_v: string) { return 'x'; }
	override disconnected() { log.push('disconnected'); }
}
const probe = directive(Probe);

describe('unmount', () => {
	it('disconnects directives and empties the container', () => {
		log = [];
		const c = document.createElement('div');
		render(t`<p>${probe('a')}</p>`, c);
		unmount(c);
		expect(log).toEqual(['disconnected']);
		expect(c.innerHTML).toBe('');
	});
	it('render() disconnects when a different template replaces the old one', () => {
		log = [];
		const c = document.createElement('div');
		render(t`<p>${probe('a')}</p>`, c);
		render(t`<b>${'z'}</b>`, c);
		expect(log).toEqual(['disconnected']);
	});
});
