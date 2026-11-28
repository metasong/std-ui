import { describe, expect, it } from 'vitest';
import { Signal } from 'signal-polyfill';
import { computed, state } from '@std-ui/core';
import { changes } from './index.js';

// `changes` on plain writable signals (`state()`, a raw `Signal.State`), not store nodes.

describe('changes: plain signals', () => {
	it('tracks dirty and resets a state()', () => {
		const n = changes(state(1));
		n.set(2);
		expect(n.changes.dirty.get()).toBe(true);
		n.changes.reset();
		expect(n.get()).toBe(1);
		expect(n.changes.dirty.get()).toBe(false);
	});

	it('initial is the value when applied, and later writes do not move it', () => {
		const s = state(1).with(changes);
		s.set(2);
		s.set(3);
		expect(s.changes.initial.get()).toBe(1);
	});

	it('dirty goes back to false when the value returns to the initial one', () => {
		const s = state(1).with(changes);
		s.set(2);
		expect(s.changes.dirty.get()).toBe(true);
		s.set(1);
		expect(s.changes.dirty.get()).toBe(false);
	});

	it('compares object values deeply', () => {
		const s = state({ a: 1, list: [1, 2] }).with(changes);
		s.set({ a: 1, list: [1, 2] });
		expect(s.changes.dirty.get()).toBe(false);
		s.set({ a: 1, list: [1, 3] });
		expect(s.changes.dirty.get()).toBe(true);
		s.changes.reset();
		expect(s.get()).toEqual({ a: 1, list: [1, 2] });
	});

	it('reset(next) makes next the new initial value and writes it', () => {
		const s = state(1).with(changes);
		s.set(2);
		s.changes.reset(5);
		expect(s.get()).toBe(5);
		expect(s.changes.initial.get()).toBe(5);
		expect(s.changes.dirty.get()).toBe(false);
		s.set(6);
		s.changes.reset();
		expect(s.get()).toBe(5);
	});

	it('reset(peek) marks the current value as saved', () => {
		const s = state('a').with(changes);
		s.set('b');
		s.changes.reset(s.peek());
		expect(s.changes.dirty.get()).toBe(false);
		expect(s.changes.initial.get()).toBe('b');
	});

	it('dirty is tracked: a computed over it updates', () => {
		const s = state(1).with(changes);
		const label = computed(() => (s.changes.dirty.get() ? 'edited' : 'clean'));
		expect(label.get()).toBe('clean');
		s.set(2);
		expect(label.get()).toBe('edited');
	});

	it('works on a raw Signal.State', () => {
		const s = changes(new Signal.State(1));
		s.set(2);
		expect(s.changes.dirty.get()).toBe(true);
		s.changes.reset();
		expect(s.get()).toBe(1);
	});
});
