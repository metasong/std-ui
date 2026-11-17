import { describe, expect, it } from 'vitest';
import { state } from '@std-ui/core';
import { changes } from './index.js';

describe("changes: depth 'value'", () => {
	it('dirty is one deep comparison', () => {
		const s = state({ n: 1 }, { depth: 'value' }).with(changes);
		s.set({ n: 2 });
		expect(s.changes.dirty()).toBe(true);
		s.set({ n: 1 });
		expect(s.changes.dirty()).toBe(false);
	});
});

describe('changes: adopted nodes', () => {
	it('reset() writes the initial plain value into the adopted node', () => {
		const addr = state({ city: 'Paris' });
		const user = state({ address: addr }).with(changes);
		user.address.city.set('Rome');
		expect(user.changes.dirty()).toBe(true);
		user.changes.reset();
		expect(addr.peek()).toEqual({ city: 'Paris' });
		expect(user.changes.dirty()).toBe(false);
	});
});
