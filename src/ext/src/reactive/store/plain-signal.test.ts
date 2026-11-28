import { describe, expect, it } from 'vitest';
import { computed, state } from '@std-ui/core';
import { changes } from './changes/index.js';
import { check } from './check/index.js';
import { formUi } from './form-ui/index.js';

// Features together on plain signals. Each feature on its own is tested next to it
// (`check/`, `changes/`, `form-ui/` `plain-signal.test.ts`); `.with()` itself in core (`with.test.ts`).

describe('features together on a plain signal', () => {
	it('chains check, changes and formUi on a state(), and check and formUi on a computed()', () => {
		const n = state(1).with(check).with(changes).with(formUi);
		n.set(2);
		expect(n.changes.dirty.get()).toBe(true);
		expect(n.check.valid.get()).toBe(true);
		expect(n.formUi.touched.get()).toBe(false);

		const c = computed(() => n.get() * 2).with(check).with(formUi);
		expect(c.check.valid.get()).toBe(true);
		expect(c.formUi.disabled.get()).toBe(false);
	});

	it('applying a feature twice returns the same signal and keeps what it built', () => {
		const s = state(1);
		const checked = s.with(check);
		expect(checked).toBe(s);
		expect(checked.with(check)).toBe(s);
		expect(check(s)).toBe(s);

		const before = checked.check;
		formUi(formUi(s));
		changes(changes(s));
		expect(checked.check).toBe(before);
	});

	it('a disabled formUi switches validation off, whatever the order', () => {
		const rule = (v: string) => (v ? null : { flag: 'valueMissing' as const, message: 'x' });

		const a = state('').with(check).with(formUi);
		a.check.validators.set([rule]);
		expect(a.check.valid.get()).toBe(false);
		a.formUi.disabled.own.set(true);
		expect(a.check.valid.get()).toBe(true);

		const b = state('').with(formUi).with(check);
		b.check.validators.set([rule]);
		b.formUi.disabled.own.set(true);
		expect(b.check.valid.get()).toBe(true);
	});

	it('a plain object or a Map is left untouched by every feature', () => {
		const plain = { get: () => 1 };
		const map = new Map();
		for (const target of [plain, map] as unknown as { get(): unknown; set?(v: never): void }[]) {
			check(target);
			formUi(target);
			expect('check' in target).toBe(false);
			expect('formUi' in target).toBe(false);
		}
	});
});
