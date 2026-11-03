import { describe, expect, it } from 'vitest';
import * as templateIndex from './index.js';

describe('template/index.ts barrel', () => {
	it('re-exports the public html/svg/render/unsafeHTML API', () => {
		expect(templateIndex.html).toBeTypeOf('function');
		expect(templateIndex.svg).toBeTypeOf('function');
		expect(templateIndex.render).toBeTypeOf('function');
		expect(templateIndex.unsafeHTML).toBeTypeOf('function');
	});

	it('render(html(...)) end-to-end works through the barrel exports alone', () => {
		const container = document.createElement('div');
		templateIndex.render(templateIndex.html`<p>${'hi'}</p>`, container);
		expect(container.textContent).toBe('hi');
	});
});
