import { describe, expect, it } from 'vitest';
import { computed } from './computed.js';
import { state } from './state.js';

// `.with()` is feature-agnostic: it only calls `feature(this)`. Real features live in the `ext` package.

/** A tiny feature: adds `tag` to the node it gets and returns the same node, so calls chain. */
function tagged<S extends object>(label: string) {
	return (node: S): S & { readonly tag: string } => {
		Object.defineProperty(node, 'tag', { value: label, configurable: true });
		return node as S & { readonly tag: string };
	};
}

describe('state().with()', () => {
	it('passes the state itself to the feature', () => {
		const s = state(1);
		let seen: unknown;
		s.with((node) => {
			seen = node;
		});
		expect(seen).toBe(s);
	});

	it('returns whatever the feature returns', () => {
		const s = state(1);
		expect(s.with(() => 42)).toBe(42);
		expect(s.with((node) => node.get() + 1)).toBe(2);
		expect(s.with(() => undefined)).toBeUndefined();
	});

	it('chains when a feature returns the node', () => {
		const s = state(1);
		const out = s.with(tagged('a')).with(tagged('b'));
		expect(out).toBe(s);
		expect(out.tag).toBe('b');
	});

	it('gives the feature a typed node', () => {
		const s = state(3);
		const doubled = s.with((node) => node.peek() * 2);
		expect(doubled).toBe(6);
	});

	it('does not change how the state reads and writes', () => {
		const s = state(1);
		s.with(tagged('x'));
		s.set(2);
		expect(s.get()).toBe(2);
		expect(s.update((n) => n + 1)).toBe(3);
		expect(s.peek()).toBe(3);
	});

	it('is a method of State, not an own enumerable key', () => {
		const s = state(1);
		expect(typeof s.with).toBe('function');
		expect(Object.keys(s)).not.toContain('with');
	});

	it('lets an error from the feature propagate and leaves the state intact', () => {
		const s = state(1);
		expect(() =>
			s.with(() => {
				throw new Error('boom');
			}),
		).toThrow('boom');
		s.set(2);
		expect(s.get()).toBe(2);
	});

	it('does not track the state by itself', () => {
		const s = state(1);
		let runs = 0;
		const c = computed(() => {
			runs++;
			return s.with(() => 'no read');
		});
		expect(c.get()).toBe('no read');
		s.set(2);
		expect(c.get()).toBe('no read');
		expect(runs).toBe(1);
	});

	it('tracks what the feature reads', () => {
		const s = state(1);
		const c = computed(() => s.with((node) => node.get() * 10));
		expect(c.get()).toBe(10);
		s.set(2);
		expect(c.get()).toBe(20);
	});

	it('works on states with a custom equals option', () => {
		const s = state({ id: 1 }, { equals: (a, b) => a.id === b.id });
		expect(s.with(tagged('e')).tag).toBe('e');
	});
});

describe('computed().with()', () => {
	it('passes the computed itself to the feature', () => {
		const c = computed(() => 1);
		let seen: unknown;
		c.with((node) => {
			seen = node;
		});
		expect(seen).toBe(c);
	});

	it('returns whatever the feature returns', () => {
		const c = computed(() => 5);
		expect(c.with((node) => node.peek() + 1)).toBe(6);
		expect(c.with(() => 'x')).toBe('x');
	});

	it('chains when a feature returns the node', () => {
		const c = computed(() => 1);
		const out = c.with(tagged('a')).with(tagged('b'));
		expect(out).toBe(c);
		expect(out.tag).toBe('b');
	});

	it('does not change how the computed reads', () => {
		const s = state(1);
		const c = computed(() => s.get() + 1);
		c.with(tagged('x'));
		expect(c.get()).toBe(2);
		s.set(5);
		expect(c.get()).toBe(6);
		expect(c.peek()).toBe(6);
	});

	it('is a method of Computed, not an own enumerable key', () => {
		const c = computed(() => 1);
		expect(typeof c.with).toBe('function');
		expect(Object.keys(c)).not.toContain('with');
	});
});
