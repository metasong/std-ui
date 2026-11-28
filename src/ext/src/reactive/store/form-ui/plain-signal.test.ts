import { describe, expect, it } from 'vitest';
import { computed, state } from '@std-ui/core';
import { formUi } from './index.js';

// `formUi` on plain signals (`state()`, `computed()`), not store nodes.

describe('formUi: plain signals', () => {
	it('gives a state() touched / readonly / disabled', () => {
		const n = formUi(state(''));
		expect(n.formUi.touched.get()).toBe(false);
		n.formUi.touch();
		expect(n.formUi.touched.get()).toBe(true);
		n.formUi.disabled.own.set(true);
		expect(n.formUi.disabled.get()).toBe(true);
	});

	it('touch / untouch / touchAll / untouchAll set the own flag', () => {
		const s = state('').with(formUi);
		s.formUi.touch();
		expect(s.formUi.touched.own.get()).toBe(true);
		s.formUi.untouch();
		expect(s.formUi.touched.get()).toBe(false);
		s.formUi.touchAll();
		expect(s.formUi.touched.get()).toBe(true);
		s.formUi.untouchAll();
		expect(s.formUi.touched.get()).toBe(false);
	});

	it('readonly and disabled are independent own flags', () => {
		const s = state('').with(formUi);
		s.formUi.readonly.own.set(true);
		expect(s.formUi.readonly.get()).toBe(true);
		expect(s.formUi.disabled.get()).toBe(false);
	});

	it('flags are tracked: a computed over touched updates', () => {
		const s = state('').with(formUi);
		const shown = computed(() => s.formUi.touched.get());
		expect(shown.get()).toBe(false);
		s.formUi.touch();
		expect(shown.get()).toBe(true);
	});

	it('two plain signals do not share flags', () => {
		const a = state('').with(formUi);
		const b = state('').with(formUi);
		a.formUi.touch();
		expect(b.formUi.touched.get()).toBe(false);
	});

	it('works on a computed()', () => {
		const c = computed(() => 1).with(formUi);
		expect(c.formUi.disabled.get()).toBe(false);
		c.formUi.readonly.own.set(true);
		expect(c.formUi.readonly.get()).toBe(true);
	});
});
