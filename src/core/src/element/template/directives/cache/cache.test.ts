import { describe, expect, it } from 'vitest';
import { cache } from './index.js';
import { Directive, directive, type DirectivePart } from '../directive.js';
import { ChildRenderer, renderWith } from '../../parts/child-renderers/index.js';
import { render } from '../../render.js';
import { t } from '../../tag-funcs/html/index.js';

let disposed = 0;
/** A child renderer that only records `dispose()` - the thing a part's own `dispose()` (not `disconnect()`) reaches. */
class SpyRenderer extends ChildRenderer<string> {
	update(): boolean { return true; }
	dispose(): void { disposed++; }
}
class SpyDirective extends Directive {
	override update(_part: DirectivePart) { return renderWith(SpyRenderer, 'x'); }
}
const spy = directive(SpyDirective);

const templateA = () => t`<p>${spy()}</p>`;
const templateB = () => t`<i>${spy()}</i>`;

describe('cache()', () => {
	it('disposes the parts of the active and the stashed templates when the cache itself is removed', () => {
		disposed = 0;
		const c = document.createElement('div');
		const view = (mode: 'a' | 'b' | 'off') => t`<div>${mode === 'off' ? 'off' : cache(mode === 'a' ? templateA() : templateB())}</div>`;

		render(view('a'), c);
		render(view('b'), c); // A is now stashed, B active
		expect(disposed).toBe(0);

		render(view('off'), c); // the cache() renderer is replaced and disposed
		expect(disposed).toBe(2);
	});
});
