import { describe, expect, it } from 'vitest';
import { effect } from '../effect/index.js';
import { flushEffects } from '../effect/test-helpers.js';
import { signalState } from './main.js';
import type { Validator } from './node.js';

const required: Validator<string> = (v) => (v ? undefined : { kind: 'required', message: 'Required' });

describe('validators', () => {
	it('keeps reads raw and reports own errors on a leaf', () => {
		const s = signalState({ name: '' });
		s.name.check.validators.set([required]);
		expect(s.name()).toBe('');
		expect(s.name.check.errors()).toEqual([{ kind: 'required', message: 'Required' }]);
		s.name.set('x');
		expect(s.name.check.errors()).toEqual([]);
	});

	it('aggregates valid() over descendants but errors() stays own-only', () => {
		const s = signalState({ user: { name: '' }, tags: ['a', ''] });
		s.user.name.check.validators.set([required]);
		s.tags[1]!.check.validators.set([required as Validator<any>]);
		expect(s.user.check.errors()).toEqual([]);
		expect(s.user.check.valid()).toBe(false);
		expect(s.tags.check.valid()).toBe(false);
		expect(s.check.valid()).toBe(false);
		s.user.name.set('n');
		s.tags[1]!.set('b');
		expect(s.check.valid()).toBe(true);
	});

	it('branch validators see the raw subtree and are reactive', async () => {
		const s = signalState({ a: 1, b: 2 });
		s.check.validators.set([(v) => (v.a < v.b ? undefined : [{ kind: 'order', message: 'a<b' }])]);
		const seen: number[] = [];
		effect(() => void seen.push(s.check.errors().length));
		s.a.set(5);
		await flushEffects();
		s.a.set(0);
		await flushEffects();
		expect(seen).toEqual([0, 1, 0]);
	});

	it('allErrors() lists every descendant error with its path', () => {
		const s = signalState({ user: { name: '' }, tags: ['a', ''] });
		s.user.name.check.validators.set([required]);
		s.tags[1]!.check.validators.set([required as Validator<any>]);
		s.check.validators.set([() => ({ kind: 'root', message: 'r' })]);
		expect(s.check.allErrors().map((e) => [e.kind, e.path])).toEqual([
			['required', ['user', 'name']],
			['required', ['tags', 1]],
			['root', []],
		]);
		expect(s.user.check.allErrors()[0].path).toEqual(['name']);
	});

	it('`_` reaches members whose names collide with the API', () => {
		const s = signalState({ check: 1, _: 1, user: { name: 'a' } });
		expect(typeof s.check.valid).toBe('function');
		expect(s.check.valid.peek()).toBe(true); // validation computed, not the member
		s._.check.set(2);
		expect(s.deep().check).toBe(2);
		expect(s._._()).toBe(1);
		expect(s._.user.name()).toBe('a');
	});

	it('configurable validators are plain factories', () => {
		const range = (min: number, max: number, message = `Must be between ${min} and ${max}`): Validator<number> =>
			(value) => (value >= min && value <= max ? undefined : { kind: 'range', message });
		const form = signalState({ age: 1 });
		form.age.check.validators.set([range(2, 8, 'value must be between 2 and 8')]);
		expect(form.age.check.errors()).toEqual([{ kind: 'range', message: 'value must be between 2 and 8' }]);
		form.age.set(5);
		expect(form.age.check.valid()).toBe(true);
	});

	it('array validators', () => {
		const s = signalState({ list: [1] });
		s.list.check.validators.set([(v) => (v.length ? undefined : { kind: 'empty', message: 'empty' })]);
		expect(s.list.check.valid()).toBe(true);
		s.list.clear();
		expect(s.list.check.errors()[0].kind).toBe('empty');
	});

	describe('changes.dirty / changes.reset()', () => {
		it('leaf: dirty tracks difference from the initial value; reset restores it', () => {
			const s = signalState({ name: 'a' });
			expect(s.name.changes.dirty()).toBe(false);
			s.name.set('b');
			expect(s.name.changes.dirty()).toBe(true);
			s.name.set('a');
			expect(s.name.changes.dirty()).toBe(false);
			s.name.set('z');
			s.name.changes.reset();
			expect(s.name()).toBe('a');
		});

		it('branch: dirty is deep and reset undoes nested edits, added and deleted members', () => {
			const s = signalState<{ user: { name: string; extra?: number }; tags: string[]; n: number }>({
				user: { name: 'a' },
				tags: ['x'],
				n: 1,
			});
			expect(s.changes.dirty()).toBe(false);
			s.user.name.set('b');
			s.tags.push('y');
			s.user.set({ extra: 5 });
			s.delete('n');
			expect(s.changes.dirty()).toBe(true);
			expect(s.user.changes.dirty()).toBe(true);
			s.changes.reset();
			expect(s.deep()).toEqual({ user: { name: 'a' }, tags: ['x'], n: 1 });
			expect(s.changes.dirty()).toBe(false);
		});

		it('reset restores an object cleared with set(null)', () => {
			const s = signalState({ a: 1 });
			s.set(null as any);
			expect(s.changes.dirty()).toBe(true);
			s.changes.reset();
			expect(s.deep()).toEqual({ a: 1 });
		});

		it('array: reorder is dirty, reset restores and keeps validators', () => {
			const s = signalState({ list: [1, 2] });
			s.list.check.validators.set([() => undefined]);
			s.list.set([2, 1]);
			expect(s.list.changes.dirty()).toBe(true);
			s.list.changes.reset();
			expect(s.list.deep()).toEqual([1, 2]);
			expect(s.list.check.validators.peek()).toHaveLength(1);
		});


		it('reset(next) sets a new initial value and writes it, at every level', () => {
			const s = signalState<{ user: { name: string; extra?: number }; tags: string[] }>({ user: { name: 'a' }, tags: ['x'] });
			s.user.set({ extra: 1 });
			s.changes.reset({ user: { name: 'b' }, tags: ['y', 'z'] });
			expect(s.deep()).toEqual({ user: { name: 'b' }, tags: ['y', 'z'] });
			expect(s.changes.dirty()).toBe(false);
			expect(s.user.name.changes.dirty()).toBe(false);
			s.user.name.set('c');
			expect(s.changes.dirty()).toBe(true);
			s.changes.reset(); // back to the new initial value, not the creation value
			expect(s.user.name()).toBe('b');
		});

		it('reset(node.peek()) marks the current value as saved', () => {
			const s = signalState({ n: 1, list: [1] });
			s.n.set(2);
			s.list.push(2);
			s.changes.reset(s.peek());
			expect(s.changes.dirty()).toBe(false);
			s.n.set(3);
			expect(s.n.changes.dirty()).toBe(true);
			s.changes.reset();
			expect(s.deep()).toEqual({ n: 2, list: [1, 2] });
		});	});
});



