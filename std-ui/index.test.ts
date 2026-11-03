import { describe, expect, it } from 'vitest';
import * as miniUi from './index.js';

describe('mini-ui/index.ts barrel', () => {
	it('re-exports the full public API surface', () => {
		expect(miniUi.element).toBeTypeOf('function');
		expect(miniUi.UIElement).toBeTypeOf('function');
		expect(miniUi.html).toBeTypeOf('function');
		expect(miniUi.svg).toBeTypeOf('function');
		expect(miniUi.render).toBeTypeOf('function');
		expect(miniUi.unsafeHTML).toBeTypeOf('function');
		expect(miniUi.buildSignalTree).toBeTypeOf('function');
		expect(miniUi.computed).toBeTypeOf('function');
		expect(miniUi.effect).toBeTypeOf('function');
		expect(miniUi.signal).toBeTypeOf('function');
	});
});
