import { Signal } from 'signal-polyfill';
import { describe, expect, it } from 'vitest';
import { computed } from './computed.js';
import { state } from './state.js';
import { isReadableSignal, isWritableSignal, markSignal, peekSignal } from './signal-type.js';

describe('signal guards', () => {
	it('accept state(), computed() and standard signals', () => {
		expect(isReadableSignal(state(1))).toBe(true);
		expect(isReadableSignal(computed(() => 1))).toBe(true);
		expect(isReadableSignal(new Signal.State(1))).toBe(true);
		expect(isWritableSignal(state(1))).toBe(true);
		expect(isWritableSignal(new Signal.State(1))).toBe(true);
		expect(isWritableSignal(computed(() => 1))).toBe(false);
	});
	it('accept a marked node, and need set() for writable', () => {
		const node = markSignal({ get: () => 1, peek: () => 1 });
		expect(isReadableSignal(node)).toBe(true);
		expect(isWritableSignal(node)).toBe(false);
		expect(isWritableSignal(markSignal({ get: () => 1, set() {} }))).toBe(true);
	});
	it('reject plain values and unmarked accessors', () => {
		expect(isReadableSignal({ get() {}, peek() {}, set() {} })).toBe(false);
		expect(isWritableSignal({ get() {}, set() {} })).toBe(false);
		expect(isReadableSignal(new Map())).toBe(false);
		expect(isReadableSignal(null)).toBe(false);
		expect(isReadableSignal(1)).toBe(false);
	});
	it('peekSignal reads untracked with or without peek()', () => {
		expect(peekSignal(state(3))).toBe(3);
		expect(peekSignal(new Signal.State(4))).toBe(4);
	});
});
