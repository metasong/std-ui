import { describe, expect, it } from 'vitest';
import { effect } from '@std-ui/core';
import { store } from '../index.js';
import { changes } from '../changes/index.js';
import { flushEffects } from '../../../../../core/src/reactive/effect/test-helpers.js';
import { check, type Validator } from './main.js';

const required: Validator<string> = (v) => (v ? undefined : { flag: 'valueMissing', message: 'Required' });

describe('validators', () => {
	it('keeps reads raw and reports own errors on a leaf', () => {
		const s = check(store({ name: '' }));
		s.name.check.validators.set([required]);
		expect(s.name.get()).toBe('');
		expect(s.name.check.errors.get()).toEqual([{ flag: 'valueMissing', message: 'Required' }]);
		s.name.set('x');
		expect(s.name.check.errors.get()).toEqual([]);
	});

	it('aggregates valid() over descendants but valid.own()/errors() stay own-only', () => {
		const s = check(store({ user: { name: '' }, tags: ['a', ''] }));
		s.user.name.check.validators.set([required]);
		s.tags[1]!.check.validators.set([required as Validator<any>]);
		expect(s.user.check.errors.get()).toEqual([]);
		expect(s.user.check.valid.own.get()).toBe(true);
		expect(s.user.check.valid.get()).toBe(false);
		expect(s.tags.check.valid.get()).toBe(false);
		expect(s.check.valid.get()).toBe(false);
		s.user.name.set('n');
		s.tags[1]!.set('b');
		expect(s.check.valid.get()).toBe(true);
	});

	it('branch validators see the raw subtree and are reactive', async () => {
		const s = check(store({ a: 1, b: 2 }));
		s.check.validators.set([(v) => (v.a < v.b ? undefined : [{ flag: 'customError', message: 'a<b' }])]);
		const seen: number[] = [];
		effect(() => void seen.push(s.check.errors.get().length));
		s.a.set(5);
		await flushEffects();
		s.a.set(0);
		await flushEffects();
		expect(seen).toEqual([0, 1, 0]);
	});

	it('errors() lists every descendant error with its path', () => {
		const s = check(store({ user: { name: '' }, tags: ['a', ''] }));
		s.user.name.check.validators.set([required]);
		s.tags[1]!.check.validators.set([required as Validator<any>]);
		s.check.validators.set([() => ({ flag: 'customError', message: 'r' })]);
		expect(s.check.errors.all.get().map((e) => [e.flag, e.path])).toEqual([
    ['valueMissing', ['user', 'name']],
    ['valueMissing', ['tags', 1]],
			['customError', []],
		]);
		expect(s.user.check.errors.all.get()[0].path).toEqual(['name']);
	});

	it('`_` reaches members whose names collide with the API', () => {
		const s = check(store({ check: 1, _: 1, user: { name: 'a' } }));
		expect(typeof s.check.valid).toBe('object');
		expect(s.check.valid.peek()).toBe(true); // validation computed, not the member
		s._.check.set(2);
		expect(s.deep().check).toBe(2);
		expect(s._._.get()).toBe(1);
		expect(s._.user.name.get()).toBe('a');
	});

	it('configurable validators are plain factories', () => {
		const range = (min: number, max: number, message = `Must be between ${min} and ${max}`): Validator<number> =>
			(value) => (value >= min && value <= max ? undefined : { flag: 'customError', message });
		const form = check(store({ age: 1 }));
		form.age.check.validators.set([range(2, 8, 'value must be between 2 and 8')]);
		expect(form.age.check.errors.get()).toEqual([{ flag: 'customError', message: 'value must be between 2 and 8' }]);
		form.age.set(5);
		expect(form.age.check.valid.own.get()).toBe(true);
	});

	it('array validators', () => {
		const s = check(store({ list: [1] }));
		s.list.check.validators.set([(v) => (v.length ? undefined : { flag: 'valueMissing', message: 'empty' })]);
		expect(s.list.check.valid.own.get()).toBe(true);
		s.list.clear();
		expect(s.list.check.errors.get()[0].flag).toBe('valueMissing');
	});

	describe('changes.dirty / changes.reset()', () => {
		it('a leaf with an explicit equals uses it for dirty', () => {
			const s = store({ id: 1, tag: 'a' }, { depth: 'value', equals: (a: { id: number }, b: { id: number }) => a.id === b.id }).with(check).with(changes);
			s.set({ id: 1, tag: 'b' });
			expect(s.changes.dirty.get()).toBe(false);
			s.set({ id: 2, tag: 'b' });
			expect(s.changes.dirty.get()).toBe(true);
		});
		it('leaf: dirty tracks difference from the initial value; reset restores it', () => {
			const s = store({ name: 'a' }).with(check).with(changes);
			expect(s.name.changes.dirty.get()).toBe(false);
			s.name.set('b');
			expect(s.name.changes.dirty.get()).toBe(true);
			s.name.set('a');
			expect(s.name.changes.dirty.get()).toBe(false);
			s.name.set('z');
			s.name.changes.reset();
			expect(s.name.get()).toBe('a');
		});

		it('branch: dirty is deep and reset undoes nested edits, added and deleted members', () => {
			const s = store<{ user: { name: string; extra?: number }; tags: string[]; n: number }>({
				user: { name: 'a' },
				tags: ['x'],
				n: 1,
			}).with(changes);
			expect(s.changes.dirty.get()).toBe(false);
			s.user.name.set('b');
			s.tags.push('y');
			s.user.set({ extra: 5 });
			s.delete('n');
			expect(s.changes.dirty.get()).toBe(true);
			expect(s.user.changes.dirty.get()).toBe(true);
			s.changes.reset();
			expect(s.deep()).toEqual({ user: { name: 'a' }, tags: ['x'], n: 1 });
			expect(s.changes.dirty.get()).toBe(false);
		});

		it('reset restores an object cleared with set(null)', () => {
			const s = store({ a: 1 }).with(check).with(changes);
			s.set(null as any);
			expect(s.changes.dirty.get()).toBe(true);
			s.changes.reset();
			expect(s.deep()).toEqual({ a: 1 });
		});

		it('array: reorder is dirty, reset restores and keeps validators', () => {
			const s = store({ list: [1, 2] }).with(check).with(changes);
			s.list.check.validators.set([() => undefined]);
			s.list.set([2, 1]);
			expect(s.list.changes.dirty.get()).toBe(true);
			s.list.changes.reset();
			expect(s.list.deep()).toEqual([1, 2]);
			expect(s.list.check.validators.peek()).toHaveLength(1);
		});


		it('reset(next) sets a new initial value and writes it, at every level', () => {
			const s = store<{ user: { name: string; extra?: number }; tags: string[] }>({ user: { name: 'a' }, tags: ['x'] }).with(changes);
			s.user.set({ extra: 1 });
			s.changes.reset({ user: { name: 'b' }, tags: ['y', 'z'] });
			expect(s.changes.initial.get()).toEqual({ user: { name: 'b' }, tags: ['y', 'z'] });
			expect(s.deep()).toEqual({ user: { name: 'b' }, tags: ['y', 'z'] });
			expect(s.changes.dirty.get()).toBe(false);
			expect(s.user.name.changes.dirty.get()).toBe(false);
			s.user.name.set('c');
			expect(s.changes.dirty.get()).toBe(true);
			s.changes.reset(); // back to the new initial value, not the creation value
			expect(s.user.name.get()).toBe('b');
		});

		it('reset(node.peek()) marks the current value as saved', () => {
			const s = store({ n: 1, list: [1] }).with(check).with(changes);
			s.n.set(2);
			s.list.push(2);
			s.changes.reset(s.peek());
			expect(s.changes.dirty.get()).toBe(false);
			s.n.set(3);
			expect(s.n.changes.dirty.get()).toBe(true);
			s.changes.reset();
			expect(s.deep()).toEqual({ n: 2, list: [1, 2] });
		});	});
});

describe('lazy check', () => {
	it('picks up a validator added to a deep descendant after the parent aggregate was read', async () => {
		const s = store({ a: { b: { c: '' } }, list: [''] }).with(check).with(changes);
		let valid = 0;
		let errs = 0;
		effect(() => void (valid = s.check.valid.get() ? 1 : 2));
		effect(() => void (errs = s.check.errors.all.get().length));
		await flushEffects();
		expect([valid, errs]).toEqual([1, 0]);

		s.a.b.c.check.validators.set([required]);
		await flushEffects();
		expect([valid, errs]).toEqual([2, 1]);
		expect(s.check.errors.all.get()[0]!.path).toEqual(['a', 'b', 'c']);

		s.a.b.c.set('x');
		await flushEffects();
		expect([valid, errs]).toEqual([1, 0]);

		s.list[0]!.check.validators.set([required as Validator<any>]);
		await flushEffects();
		expect([valid, errs]).toEqual([2, 1]);
	});

	it('does not build descendants when a parent aggregate is read', () => {
		const s = store({ a: { b: '' } }).with(check).with(changes);
		expect(s.check.valid.get()).toBe(true);
		const own = Object.getOwnPropertyDescriptor(s.a.b, 'check')!;
		expect(typeof own.get).toBe('function');
		expect(s.check.errors.all.get()).toEqual([]);
		expect(s.check.pending.get()).toBe(false);
	});
});

describe('check on a depth: "value" tree', () => {
	it('validity aggregates equal the node ones (a leaf has no children)', () => {
		const s = store({ n: 1 }, { depth: 'value' }).with(check).with(changes);
		s.check.validators.set([(v) => (v.n > 1 ? { flag: 'rangeOverflow', message: 'too big' } : null)]);
		expect(s.check.valid.get()).toBe(s.check.valid.own.get());
		s.set({ n: 2 });
		expect(s.check.valid.own.get()).toBe(false);
		expect(s.check.valid.get()).toBe(false);
		expect(s.check.errors.all.get().map((e) => e.message)).toEqual(s.check.errors.get().map((e) => e.message));
		expect(s.check.errors.all.get().every((e) => e.path.length === 0)).toBe(true);
	});
});
